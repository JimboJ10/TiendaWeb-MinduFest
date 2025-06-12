const fs = require('fs');
const ejs = require('ejs');
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const pool = require('../db/pool');
const { crearAsientoVenta } = require('./financieroController');

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

    const client = await pool.connect();

    try {
        // Obtener el estadoid de "Procesando"
        const estadoResult = await client.query(
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
        const ventaResult = await client.query(
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
            await client.query(
                `INSERT INTO detalleventa (ventaid, usuarioid, productoid, cantidad, subtotal) 
                VALUES ($1, $2, $3, $4, $5)`,
                [ventaid, usuarioid, item.productoid, item.cantidad, item.precio * item.cantidad]
            );

            await client.query(
                `UPDATE producto 
                SET stock = stock - $1, 
                    nventas = nventas + 1 
                WHERE productoid = $2`,
                [item.cantidad, item.productoid]
            );
        }

        // Limpiar carrito
        await client.query(
            `DELETE FROM carrito WHERE usuarioid = $1`, 
            [usuarioid]
        );

        await client.query('COMMIT');

        // Crear asiento contable (movimiento de caja) DESPUÉS del commit
        try {
            await crearAsientoVenta(ventaid);
            console.log(`Movimiento de caja creado para venta ${ventaid}`);
        } catch (asientoError) {
            console.error('Error al crear movimiento de caja para venta:', asientoError);
            // No fallar la venta por error en contabilidad
        }

        res.status(200).json({ 
            message: 'Venta registrada con éxito', 
            ventaid, 
            total_pagar 
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al registrar venta:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    } finally {
        client.release();
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

        // Verificar que el email existe
        if (!venta.email) {
            client.release();
            return res.status(400).json({ error: 'No se encontró el email del cliente' });
        }

        // Obtener los detalles de los productos
        const detallesQuery = `
            SELECT p.titulo, dv.cantidad, p.precio::numeric
            FROM detalleventa dv
            JOIN producto p ON dv.productoid = p.productoid
            WHERE dv.ventaid = $1
        `;
        const detallesResult = await client.query(detallesQuery, [ventaid]);
        client.release();

        venta.detalles = detallesResult.rows;

        // Configurar el transporte
        const transporter = nodemailer.createTransport(smtpTransport({
            service: 'gmail',
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        }));

        // Verificar la conexión del transporte
        await transporter.verify();

        // Leer la plantilla HTML
        const template = await fs.promises.readFile(process.cwd() + '/mail.html', 'utf-8');
        const renderedHtml = ejs.render(template, { venta });

        // Enviar el correo
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: venta.email,
            subject: `Confirmación de Compra #${ventaid}`,
            html: renderedHtml
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Correo enviado con éxito' });

    } catch (err) {
        console.error('Error en enviarCorreoCompraCliente:', err);
        res.status(500).json({ 
            error: 'Error al enviar el correo',
            details: err.message 
        });
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
