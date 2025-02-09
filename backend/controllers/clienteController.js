const pool = require('../db/pool');
const bcrypt = require('bcrypt-nodejs');

const listarClientes = async (req, res) => {
    try {
        let tipo = req.params['tipo'];
        let filtro = req.params['filtro'] || '';

        const client = await pool.connect();

        let query = 'SELECT * FROM vista_clientes';
        if (tipo && filtro) {
            if (tipo === 'apellidos') {
                query += ` WHERE apellidos ILIKE '%${filtro}%'`;
            } else if (tipo === 'correo') {
                query += ` WHERE email ILIKE '%${filtro}%'`;
            }
        }

        const result = await client.query(query);
        client.release();

        res.json(result.rows);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

const registrarCliente = async (req, res) => {
    try {
        const {
            dni, nombres, apellidos, email, pais,
            telefono, fNacimiento, genero
        } = req.body;

        const client = await pool.connect();
        const query = 'SELECT registrar_cliente($1, $2, $3, $4, $5, $6, $7, $8)';
        const values = [dni, nombres, apellidos, email, pais, telefono, fNacimiento, genero];

        const result = await client.query(query, values);
        client.release();

        res.status(200).json({ message: 'Cliente registrado con éxito', usuarioid: result.rows[0].registrar_cliente });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

const obtenerCliente = async (req, res) => {
    try {
        const { id } = req.params;

        const client = await pool.connect();
        const query = 'SELECT * FROM obtener_cliente($1)';
        const values = [id];

        const result = await client.query(query, values);
        client.release();

        if (result.rows.length > 0) {
            const cliente = result.rows[0];
            if (cliente.fNacimiento) {
                cliente.fNacimiento = cliente.fNacimiento.toISOString().substring(0, 10);
            }
            res.status(200).json(cliente);
        } else {
            res.status(404).json({ error: 'Cliente no encontrado' });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

const actualizarCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            dni, nombres, apellidos, email, pais,
            telefono, fNacimiento, genero
        } = req.body;

        const client = await pool.connect();
        const query = 'SELECT actualizar_cliente($1, $2, $3, $4, $5, $6, $7, $8, $9)';
        const values = [id, dni, nombres, apellidos, email, pais, telefono, fNacimiento, genero];

        await client.query(query, values);
        client.release();

        res.status(200).json({ message: 'Cliente actualizado con éxito' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

const eliminarCliente = async (req, res) => {
    try {
        const { id } = req.params;

        const client = await pool.connect();
        const query = 'SELECT eliminar_cliente($1)';
        const values = [id];

        await client.query(query, values);
        client.release();

        res.status(200).json({ message: 'Cliente eliminado con éxito' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

const obtenerClienteConRol = async (req, res) => {
    try {
        const { id } = req.params;

        const client = await pool.connect();
        const query = `
            SELECT u.*, r.nombre as rol 
            FROM usuario u 
            JOIN rol_usuario ru ON u.usuarioid = ru.usuarioid 
            JOIN rol r ON ru.rolid = r.rolid 
            WHERE u.usuarioid = $1 AND r.nombre = 'Cliente'
        `;
        const values = [id];

        const result = await client.query(query, values);
        client.release();

        if (result.rows.length > 0) {
            const cliente = result.rows[0];
            if (cliente.fNacimiento) {
                cliente.fNacimiento = cliente.fNacimiento.toISOString().substring(0, 10);
            }
            res.status(200).json(cliente);
        } else {
            res.status(404).json({ error: 'Cliente no encontrado' });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

const cambiarPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { currentPassword, newPassword } = req.body;

        const client = await pool.connect();

        // Verificar contraseña actual
        const userQuery = 'SELECT password FROM usuario WHERE usuarioid = $1';
        const userResult = await client.query(userQuery, [id]);

        if (userResult.rows.length === 0) {
            client.release();
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const validPassword = bcrypt.compareSync(currentPassword, userResult.rows[0].password);
        if (!validPassword) {
            client.release();
            return res.status(400).json({ error: 'Contraseña actual incorrecta' });
        }

        // Actualizar contraseña
        const hashedPassword = bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10));
        const updateQuery = 'UPDATE usuario SET password = $1 WHERE usuarioid = $2';
        await client.query(updateQuery, [hashedPassword, id]);

        client.release();
        res.status(200).json({ message: 'Contraseña actualizada con éxito' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// -----------------------Ordenes--------------------------------------
const obtenerOrdenesCliente = async (req, res) => {
    const client = await pool.connect(); 

    try {
        const { id } = req.params; 

        const query = `
            SELECT *
            FROM venta
            WHERE usuarioid = $1
            ORDER BY ventaid DESC
        `;
        const values = [id];

        const result = await client.query(query, values);

        if (result.rows.length > 0) {
            res.status(200).json(result.rows);
        } else {
            res.status(404).json({ error: 'No se encontraron ventas para este cliente' });
        }
    } catch (err) {
        console.log('Error al obtener ventas del cliente:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    } finally {
        client.release();
    }
};

const obtenerDetallesCliente = async (req, res) => {
    const client = await pool.connect();

    try {
        const { ventaid } = req.params;

        const query = `
            SELECT 
                v.ventaid,
                v.nventa,
                v.subtotal,
                v.enviotitulo,
                v.envioprecio,
                ev.nombre as estado,
                v.fecha,
                v.transaccion,
                v.usuarioid,
                u.nombres AS usuario_nombres,
                u.apellidos AS usuario_apellidos,
                d.destinatario,
                d.codigopostal,
                d.direcciontexto,
                d.pais,
                d.provincia,
                d.ciudad,
                p.productoid,
                p.titulo,
                p.precio,
                p.stock,
                p.descripcion,
                p.contenido,
                p.nventas,
                p.portada,
                dv.cantidad,
                (dv.cantidad * p.precio) AS subtotal_detalle,
                COALESCE(r.resenaEmitida, false) AS resenaEmitida
            FROM venta v
            JOIN direccion d ON v.direccionid = d.direccionid
            JOIN usuario u ON v.usuarioid = u.usuarioid
            JOIN estado_venta ev ON v.estadoid = ev.estadoid
            LEFT JOIN detalleventa dv ON v.ventaid = dv.ventaid
            LEFT JOIN producto p ON dv.productoid = p.productoid
            LEFT JOIN (
                SELECT productoid, usuarioid, true AS resenaEmitida
                FROM resena
                WHERE usuarioid = $1
            ) r ON p.productoid = r.productoid
            WHERE v.ventaid = $2;
        `;
        const values = [req.user.id, ventaid];

        const result = await client.query(query, values);

        if (result.rows.length > 0) {
            res.status(200).json(result.rows);
        } else {
            res.status(404).json({ error: 'No se encontraron detalles para esta venta' });
        }
    } catch (err) {
        console.error('Error al obtener los detalles de la venta:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    } finally {
        client.release();
    }
};

//------------------------Direccion-------------------------------------------------------------

const listarDirecciones = async (req, res) => {
    try {
        const { filtro_apellidos } = req.query;
        const client = await pool.connect();

        let query = `
            SELECT d.*, u.nombres, u.apellidos 
            FROM direccion d 
            JOIN usuario u ON d.usuarioid = u.usuarioid
        `;

        if (filtro_apellidos) {
            query += ` WHERE u.apellidos ILIKE '%${filtro_apellidos}%'`;
        }

        query += ' ORDER BY d.principal DESC';

        const result = await client.query(query);
        client.release();

        if (result.rows.length > 0) {
            res.status(200).json(result.rows);
        } else {
            res.status(404).json({ error: 'No se encontraron direcciones para los clientes' });
        }
    } catch (err) {
        console.log('Error al listar direcciones:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};


const registroDireccionCliente = async (req, res) => {
    const client = await pool.connect(); 

    try {
        const { usuarioid, codigopostal, direcciontexto, pais, provincia, ciudad, telefono, principal, destinatario } = req.body;

        if (!usuarioid) {
            return res.status(400).json({ error: 'El usuarioid es requerido' });
        }

        if (principal) {
            const desactivarQuery = `
                UPDATE direccion 
                SET principal = false 
                WHERE usuarioid = $1 AND principal = true
            `;
            await client.query(desactivarQuery, [usuarioid]);
        }

        const query = `
            INSERT INTO direccion (usuarioid, codigopostal, direcciontexto, pais, provincia, ciudad, telefono, principal, destinatario)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING direccionid
        `;
        const values = [usuarioid, codigopostal, direcciontexto, pais, provincia, ciudad, telefono, principal, destinatario];

        const result = await client.query(query, values);

        res.status(200).json({ message: 'Dirección registrada con éxito', direccionid: result.rows[0].direccionid });
    } catch (err) {
        console.error('Error al registrar la dirección:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    } finally {
        client.release();
    }
};

const obtenerDireccionesCliente = async (req, res) => {
    const client = await pool.connect(); 

    try {
        const { id } = req.params; 

        const query = `
            SELECT direccionid, codigopostal, direcciontexto, pais, provincia, ciudad, telefono, principal, destinatario
            FROM direccion
            WHERE usuarioid = $1
            ORDER BY principal DESC
        `;
        const values = [id];

        const result = await client.query(query, values);

        if (result.rows.length > 0) {
            res.status(200).json(result.rows);
        } else {
            res.status(404).json({ error: 'No se encontraron direcciones para este cliente' });
        }
    } catch (err) {
        console.log('Error al obtener direcciones del cliente:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    } finally {
        client.release();
    }
};

const cambiarDireccionPrincipalCliente = async (req, res) => {
    const client = await pool.connect();

    try {
        const { usuarioid, direccionid } = req.body;

        if (!usuarioid || !direccionid) {
            return res.status(400).json({ error: 'El usuarioid y direccionid son requeridos' });
        }
        const desactivarQuery = `
            UPDATE direccion 
            SET principal = false 
            WHERE usuarioid = $1 AND principal = true
        `;
        await client.query(desactivarQuery, [usuarioid]);

        const activarQuery = `
            UPDATE direccion 
            SET principal = true 
            WHERE direccionid = $1 AND usuarioid = $2
        `;
        await client.query(activarQuery, [direccionid, usuarioid]);

        res.status(200).json({ message: 'Dirección principal actualizada con éxito' });
    } catch (err) {
        console.error('Error al cambiar la dirección principal:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    } finally {
        client.release();
    }
};

const obtenerDireccionPrincipalCliente = async (req, res) => {
    const client = await pool.connect(); 

    try {
        const { id } = req.params;

        const query = `
            SELECT direccionid, codigopostal, direcciontexto, pais, provincia, ciudad, telefono, principal, destinatario
            FROM direccion
            WHERE usuarioid = $1 AND principal = true
        `;
        const values = [id];

        const result = await client.query(query, values);

        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'No se encontró una dirección principal para este cliente' });
        }
    } catch (err) {
        console.log('Error al obtener la dirección principal del cliente:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    } finally {
        client.release();
    }
};

//------------------------Reseña-------------------------------------------------------------
// Función para emitir una reseña
const emitirReviewProductoCliente = async (req, res) => {
    try {
        const { productoid, usuarioid, ventaid, estrellas, comentario } = req.body;

        // Validar que el usuario tenga el rol de Cliente
        const client = await pool.connect();

        const rolQuery = `
            SELECT r.nombre FROM rol r
            JOIN rol_usuario ru ON r.rolid = ru.rolid
            WHERE ru.usuarioid = $1 AND r.nombre = 'Cliente'
        `;
        const rolResult = await client.query(rolQuery, [usuarioid]);

        if (rolResult.rows.length === 0) {
            client.release();
            return res.status(403).json({ error: 'El usuario no tiene el rol de Cliente' });
        }

        // Validar que el producto exista y que el cliente haya comprado el producto
        const ventaQuery = `
            SELECT 1 FROM venta v
            JOIN detalleventa dv ON v.ventaid = dv.ventaid
            WHERE v.ventaid = $1 AND dv.productoid = $2 AND v.usuarioid = $3
        `;
        const ventaResult = await client.query(ventaQuery, [ventaid, productoid, usuarioid]);

        if (ventaResult.rows.length === 0) {
            client.release();
            return res.status(400).json({ error: 'El cliente no compró este producto en la venta especificada' });
        }

        // Insertar la reseña
        const insertQuery = `
            INSERT INTO resena (productoid, usuarioid, ventaid, estrellas, comentario, createdAT)
            VALUES ($1, $2, $3, $4, $5, CURRENT_DATE) RETURNING resenaid
        `;
        const values = [productoid, usuarioid, ventaid, estrellas, comentario];
        const result = await client.query(insertQuery, values);

        client.release();
        res.status(201).json({ message: 'Reseña registrada con éxito', resenaid: result.rows[0].resenaid });
    } catch (err) {
        console.error('Error al emitir la reseña:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Función para obtener reseñas de un producto
const obtenerReviewProductoCliente = async (req, res) => {
    try {
        const { productoid } = req.params;

        const client = await pool.connect();

        const query = `
            SELECT 
                r.resenaid,
                r.estrellas,
                r.comentario AS comentario,
                r.createdAT,
                u.nombres AS usuario_nombres,
                u.apellidos AS usuario_apellidos
            FROM resena r
            JOIN usuario u ON r.usuarioid = u.usuarioid
            WHERE r.productoid = $1
            ORDER BY r.createdAT DESC
        `;
        const values = [productoid];

        const result = await client.query(query, values);
        client.release();

        if (result.rows.length > 0) {
            res.status(200).json(result.rows);
        } else {
            res.status(404).json({ error: 'No se encontraron reseñas para este producto' });
        }
    } catch (err) {
        console.error('Error al obtener reseñas:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

const obtenerReviewCliente = async (req, res) => {

    try {
        const { usuarioid } = req.params;

        const client = await pool.connect();
        const query = `SELECT u.nombres, u.apellidos, u.email, r.estrellas, r.comentario, r.createdat, p.titulo FROM resena r
        join usuario u on r.usuarioid = u.usuarioid
        join producto p on r.productoid = p.productoid
        WHERE r.usuarioid = $1`;
       
        const values = [usuarioid];

        const result = await client.query(query, values);
        client.release();

        if (result.rows.length > 0) {
            res.status(200).json(result.rows);
        } else {
            res.status(404).json({ error: 'Cliente no encontrado' });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
}

module.exports = {
    listarClientes,
    registrarCliente,
    obtenerCliente,
    actualizarCliente, 
    eliminarCliente,
    cambiarPassword,
    obtenerClienteConRol,
    registroDireccionCliente,
    obtenerDireccionesCliente,
    cambiarDireccionPrincipalCliente,
    obtenerDireccionPrincipalCliente,
    listarDirecciones,
    obtenerOrdenesCliente,
    obtenerDetallesCliente,
    emitirReviewProductoCliente,
    obtenerReviewProductoCliente,
    obtenerReviewCliente
};
