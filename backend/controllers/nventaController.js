const fs = require('fs');
const ejs = require('ejs');
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const pool = require('../db/pool');

const ObtenerVentas = async (req, res) => {
    try {
        const desde = req.params['desde'] === 'null' || !req.params['desde'] ? null : req.params['desde'];
        const hasta = req.params['hasta'] === 'null' || !req.params['hasta'] ? null : req.params['hasta'];

        let query = `
            SELECT 
                v.ventaid, v.nventa, v.subtotal, v.enviotitulo, 
                v.fecha, v.nota_estado,
                ev.nombre as estado,
                u.nombres, u.apellidos
            FROM venta v
            INNER JOIN usuario u ON v.usuarioid = u.usuarioid
            INNER JOIN rol_usuario ru ON u.usuarioid = ru.usuarioid
            INNER JOIN rol r ON ru.rolid = r.rolid
            INNER JOIN estado_venta ev ON v.estadoid = ev.estadoid
            WHERE r.nombre = 'Cliente'
        `;

        const params = [];
        if (desde) {
            query += ` AND v.fecha >= $${params.length + 1}`;
            params.push(desde);
        }
        if (hasta) {
            query += ` AND v.fecha <= $${params.length + 1}`;
            params.push(hasta);
        }

        query += ` ORDER BY v.fecha DESC`;

        const ventas = await pool.query(query, params);
        res.status(200).json(ventas.rows);
    } catch (err) {
        console.error('Error al obtener ventas:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

const registrarVenta = async (req, res) => {
    const { usuarioid, carrito_arr, direccionid, transaccion, cupon, nota, precio_envio, envio_titulo } = req.body;

    try {
        // Obtener el estadoid de "Procesando"
        const estadoResult = await pool.query(
            'SELECT estadoid FROM estado_venta WHERE nombre = $1',
            ['Procesando']
        );

        if (estadoResult.rows.length === 0) {
            return res.status(400).json({ error: 'Estado de venta no encontrado' });
        }

        const estadoid = estadoResult.rows[0].estadoid;

        // Calcular el subtotal del carrito
        let subtotal = carrito_arr.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
        let total_pagar = subtotal + parseFloat(precio_envio);

        // Registrar la venta con el nuevo campo estadoid
        const ventaResult = await pool.query(
            `INSERT INTO venta (
                usuarioid, nventa, subtotal, enviotitulo, 
                envioprecio, estadoid, transaccion, 
                cupon, nota, direccionid, fecha
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP) 
            RETURNING ventaid`,
            [
                usuarioid,
                `NVENTA-${Date.now()}`,
                total_pagar,
                envio_titulo,
                precio_envio,
                estadoid,
                transaccion,
                cupon,
                nota,
                direccionid
            ]
        );

        const ventaid = ventaResult.rows[0].ventaid;

        // Registrar detalles de venta y actualizar stock
        for (const item of carrito_arr) {
            await pool.query(
                `INSERT INTO detalleventa (ventaid, usuarioid, productoid, cantidad, subtotal) 
                VALUES ($1, $2, $3, $4, $5)`,
                [ventaid, usuarioid, item.productoid, item.cantidad, item.precio * item.cantidad]
            );

            await pool.query(
                `UPDATE producto 
                SET stock = stock - $1, 
                    nventas = nventas + 1 
                WHERE productoid = $2`,
                [item.cantidad, item.productoid]
            );
        }

        // Limpiar carrito
        await pool.query(
            `DELETE FROM carrito WHERE usuarioid = $1`, 
            [usuarioid]
        );

        res.status(200).json({ 
            message: 'Venta registrada con éxito', 
            ventaid, 
            total_pagar 
        });

    } catch (err) {
        console.error('Error al registrar venta:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

const enviarCorreoCompraCliente = async (req, res) => {
    const { ventaid } = req.params;

    try {
        const client = await pool.connect();

        // Obtener los detalles de la venta
        const ventaQuery = `
            SELECT v.ventaid, v.fecha, v.subtotal, v.envioprecio, u.nombres, u.apellidos, u.email
            FROM venta v
            JOIN usuario u ON v.usuarioid = u.usuarioid
            WHERE v.ventaid = $1
        `;
        const ventaResult = await client.query(ventaQuery, [ventaid]);

        if (ventaResult.rows.length === 0) {
            client.release();
            return res.status(404).json({ error: 'Venta no encontrada' });
        }

        const venta = ventaResult.rows[0];

        // Obtener los detalles de los productos de la venta
        const detallesQuery = `
            SELECT p.titulo, dv.cantidad, p.precio::numeric
            FROM detalleventa dv
            JOIN producto p ON dv.productoid = p.productoid
            WHERE dv.ventaid = $1
        `;
        const detallesResult = await client.query(detallesQuery, [ventaid]);
        client.release();

        venta.detalles = detallesResult.rows;

        // Configurar el transporte de correo
        const transporter = nodemailer.createTransport(smtpTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            auth: {
                user: 'jimbojordy383@gmail.com',
                pass: 'pjrmfnatarzjoooa'
            },
            tls: {
                rejectUnauthorized: false
            }
        }));

        // Leer y renderizar la plantilla HTML
        const readHTMLFile = (path, callback) => {
            fs.readFile(path, { encoding: 'utf-8' }, (err, html) => {
                if (err) {
                    callback(err);
                } else {
                    callback(null, html);
                }
            });
        };

        readHTMLFile(process.cwd() + '/mail.html', (err, html) => {
            if (err) {
                console.error('Error al leer la plantilla HTML:', err);
                return res.status(500).json({ error: 'Error en el servidor' });
            }

            const renderedHtml = ejs.render(html, { venta });

            // Configurar el correo electrónico
            const mailOptions = {
                from: 'jimbojordy383@gmail.com',
                to: venta.email, // Utiliza el correo del cliente
                subject: 'Detalles de su compra',
                html: renderedHtml
            };

            // Envia el correo electrónico
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error al enviar el correo:', error);
                    return res.status(500).json({ error: 'Error al enviar el correo' });
                }
                res.status(200).json({ message: 'Correo enviado con éxito' });
            });
        });
    } catch (err) {
        console.error('Error en el servidor:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

const obtenerEstadosVenta = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM estado_venta ORDER BY estadoid');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener estados de venta' });
    }
};

const actualizarEstadoVenta = async (req, res) => {
    const { ventaid } = req.params;
    const { estadoid, nota_estado } = req.body;

    try {
        // Actualizar el estado de la venta y nota
        await pool.query(
            'UPDATE venta SET estadoid = $1, nota_estado = $2 WHERE ventaid = $3',
            [estadoid, nota_estado || null, ventaid]
        );

        // Obtener la información actualizada
        const ventaResult = await pool.query(
            `SELECT v.*, ev.nombre as estado 
             FROM venta v 
             JOIN estado_venta ev ON v.estadoid = ev.estadoid 
             WHERE v.ventaid = $1`,
            [ventaid]
        );

        res.status(200).json({ 
            message: 'Estado actualizado correctamente',
            venta: ventaResult.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar estado de venta' });
    }
};

module.exports = {
    registrarVenta,
    ObtenerVentas,
    enviarCorreoCompraCliente,
    obtenerEstadosVenta,
    actualizarEstadoVenta,
};
