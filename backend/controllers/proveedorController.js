const pool = require('../db/pool');

// Listar todos los proveedores
const listarProveedores = async (req, res) => {
    try {
        const { filtro, estado } = req.query;
        
        let query = 'SELECT * FROM proveedor WHERE 1=1';
        const params = [];
        
        if (filtro) {
            query += ' AND (nombre ILIKE $' + (params.length + 1) + ' OR email ILIKE $' + (params.length + 1) + ')';
            params.push(`%${filtro}%`);
        }
        
        if (estado) {
            query += ' AND estado = $' + (params.length + 1);
            params.push(estado);
        }
        
        query += ' ORDER BY fecha_registro DESC';
        
        const result = await pool.query(query, params);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error al listar proveedores:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Obtener un proveedor por ID
const obtenerProveedor = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            'SELECT * FROM proveedor WHERE proveedorid = $1',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }
        
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Error al obtener proveedor:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Registrar nuevo proveedor
const registrarProveedor = async (req, res) => {
    try {
        const {
            nombre,
            contacto,
            email,
            telefono,
            direccion,
            ciudad,
            pais,
            codigo_postal,
            estado = 'Activo'
        } = req.body;

        // Validar campos requeridos
        if (!nombre) {
            return res.status(400).json({ error: 'El nombre del proveedor es requerido' });
        }

        // Verificar si ya existe un proveedor con el mismo email
        if (email) {
            const emailExists = await pool.query(
                'SELECT proveedorid FROM proveedor WHERE email = $1',
                [email]
            );
            
            if (emailExists.rows.length > 0) {
                return res.status(400).json({ error: 'Ya existe un proveedor con este email' });
            }
        }

        const result = await pool.query(
            `INSERT INTO proveedor (nombre, contacto, email, telefono, direccion, ciudad, pais, codigo_postal, estado)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [nombre, contacto, email, telefono, direccion, ciudad, pais, codigo_postal, estado]
        );

        res.status(201).json({
            message: 'Proveedor registrado con éxito',
            proveedor: result.rows[0]
        });
    } catch (err) {
        console.error('Error al registrar proveedor:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Actualizar proveedor
const actualizarProveedor = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nombre,
            contacto,
            email,
            telefono,
            direccion,
            ciudad,
            pais,
            codigo_postal,
            estado
        } = req.body;

        // Verificar si el proveedor existe
        const proveedorExists = await pool.query(
            'SELECT proveedorid FROM proveedor WHERE proveedorid = $1',
            [id]
        );

        if (proveedorExists.rows.length === 0) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }

        // Verificar email duplicado (excluyendo el proveedor actual)
        if (email) {
            const emailExists = await pool.query(
                'SELECT proveedorid FROM proveedor WHERE email = $1 AND proveedorid != $2',
                [email, id]
            );
            
            if (emailExists.rows.length > 0) {
                return res.status(400).json({ error: 'Ya existe otro proveedor con este email' });
            }
        }

        const result = await pool.query(
            `UPDATE proveedor 
             SET nombre = $1, contacto = $2, email = $3, telefono = $4, 
                 direccion = $5, ciudad = $6, pais = $7, codigo_postal = $8, estado = $9
             WHERE proveedorid = $10 RETURNING *`,
            [nombre, contacto, email, telefono, direccion, ciudad, pais, codigo_postal, estado, id]
        );

        res.status(200).json({
            message: 'Proveedor actualizado con éxito',
            proveedor: result.rows[0]
        });
    } catch (err) {
        console.error('Error al actualizar proveedor:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Eliminar proveedor (cambiar estado a Inactivo)
const eliminarProveedor = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si el proveedor tiene productos asociados
        const productosAsociados = await pool.query(
            'SELECT COUNT(*) FROM inventario WHERE proveedorid = $1',
            [id]
        );

        if (parseInt(productosAsociados.rows[0].count) > 0) {
            // Solo cambiar estado a Inactivo si tiene productos asociados
            await pool.query(
                'UPDATE proveedor SET estado = $1 WHERE proveedorid = $2',
                ['Inactivo', id]
            );

            res.status(200).json({
                message: 'Proveedor marcado como inactivo (tiene productos asociados)'
            });
        } else {
            // Eliminar completamente si no tiene productos asociados
            const result = await pool.query(
                'DELETE FROM proveedor WHERE proveedorid = $1',
                [id]
            );

            if (result.rowCount === 0) {
                return res.status(404).json({ error: 'Proveedor no encontrado' });
            }

            res.status(200).json({ message: 'Proveedor eliminado con éxito' });
        }
    } catch (err) {
        console.error('Error al eliminar proveedor:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Obtener productos de un proveedor
const obtenerProductosProveedor = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT p.productoid, p.titulo, p.precio, p.stock, i.cantidad, i.inventarioid
             FROM inventario i
             JOIN producto p ON i.productoid = p.productoid
             WHERE i.proveedorid = $1
             ORDER BY p.titulo`,
            [id]
        );

        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error al obtener productos del proveedor:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Obtener estadísticas del proveedor
const obtenerEstadisticasProveedor = async (req, res) => {
    try {
        const { id } = req.params;

        const estadisticas = await pool.query(
            `SELECT 
                COUNT(i.inventarioid) as total_productos,
                SUM(i.cantidad) as total_stock,
                AVG(p.precio) as precio_promedio,
                MAX(i.cantidad) as stock_maximo,
                MIN(i.cantidad) as stock_minimo
             FROM inventario i
             JOIN producto p ON i.productoid = p.productoid
             WHERE i.proveedorid = $1`,
            [id]
        );

        res.status(200).json(estadisticas.rows[0]);
    } catch (err) {
        console.error('Error al obtener estadísticas del proveedor:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

module.exports = {
    listarProveedores,
    obtenerProveedor,
    registrarProveedor,
    actualizarProveedor,
    eliminarProveedor,
    obtenerProductosProveedor,
    obtenerEstadisticasProveedor
};