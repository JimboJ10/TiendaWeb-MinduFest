const pool = require('../db/pool');
const fs = require('fs');
const path = require('path');

const registrarProducto = async (req, res) => {
    try {
        const { titulo, precio, stock, categoria, descripcion, contenido, proveedor } = req.body;
        if (!req.files || !req.files.portada) {
            return res.status(400).json({ error: 'No se subió la imagen de portada' });
        }

        const portada = req.files.portada.path.split('\\').join('/');

        const productoResult = await pool.query(
            'INSERT INTO producto (titulo, precio, stock, categoriaid, descripcion, contenido, portada) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING productoid',
            [titulo, precio, stock, categoria, descripcion, contenido, portada]
        );

        const productoid = productoResult.rows[0].productoid;

        await pool.query(
            'INSERT INTO inventario (productoid, cantidad, proveedor) VALUES ($1, $2, $3)',
            [productoid, stock, proveedor || 'Finixware']
        );

        res.status(201).json(productoResult.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

const listarProductos = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.*, c.nombrecategoria AS categoria
            FROM producto p
            JOIN categoria c ON p.categoriaid = c.categoriaid
        `);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

const obtenerPortada = (req, res) => {
    const portada = req.params.portada;
    const pathPortada = './uploads/productos/' + portada;

    fs.exists(pathPortada, (exists) => {
        if (exists) {
            res.sendFile(path.resolve(pathPortada));
        } else {
            res.status(404).json({ message: 'La imagen no existe' });
        }
    });
};

const obtenerProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM obtener_producto($1)', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};


const actualizarProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, precio, stock, categoria, descripcion, contenido } = req.body;
        
        let portada = '';
        if (req.files && req.files.portada) {
            portada = req.files.portada.path.split('\\').join('/');
        } else {
            const existingProduct = await pool.query('SELECT portada FROM producto WHERE productoid = $1', [id]);
            if (existingProduct.rows.length === 0) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }
            portada = existingProduct.rows[0].portada;
        }

        await pool.query(
            'select actualizar_producto($1, $2, $3, $4, $5, $6, $7, $8)',
            [id, titulo, precio, stock, categoria, descripcion, contenido, portada]
        );

        res.status(200).json({ message: 'Producto actualizado correctamente' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

const eliminarProducto = async (req, res) => {
    try {
        const { id } = req.params;

        const existingProduct = await pool.query('SELECT portada FROM producto WHERE productoid = $1', [id]);
        if (existingProduct.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        const portada = existingProduct.rows[0].portada;

        await pool.query('SELECT eliminar_producto($1)', [id]);

        // Eliminar la imagen del servidor
        fs.unlinkSync(path.resolve(portada));

        res.status(200).json({ message: 'Producto eliminado correctamente' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

const listarInventarioProducto = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT i.inventarioid, p.titulo AS nombreproducto, i.cantidad, i.proveedor
            FROM inventario i
            JOIN producto p ON i.productoid = p.productoid
            WHERE i.productoid = $1
        `, [id]);

        res.status(200).json(result.rows);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

const eliminarInventarioProducto = async (req, res) => {
    const inventarioId = parseInt(req.params.id);

    try {
        await pool.query('SELECT eliminar_inventario_producto($1)', [inventarioId]);
        res.status(200).json({ message: 'Inventario eliminado y stock del producto actualizado a 0' });
    } catch (error) {
        console.error('Error al eliminar inventario:', error);
        res.status(500).json({ error: 'Error al eliminar inventario' });
    }
};

const registrarInventarioProducto = async (req, res) => {
    try {
        const { productoid, cantidad, proveedor, proveedorid } = req.body;

        // Si se proporciona proveedorid, usarlo; si no, buscar por nombre del proveedor
        let finalProveedorId = proveedorid;
        
        if (!proveedorid && proveedor) {
            const proveedorResult = await pool.query(
                'SELECT proveedorid FROM proveedor WHERE nombre = $1',
                [proveedor]
            );
            
            if (proveedorResult.rows.length > 0) {
                finalProveedorId = proveedorResult.rows[0].proveedorid;
            } else {
                // Crear nuevo proveedor si no existe
                const nuevoProveedor = await pool.query(
                    'INSERT INTO proveedor (nombre) VALUES ($1) RETURNING proveedorid',
                    [proveedor]
                );
                finalProveedorId = nuevoProveedor.rows[0].proveedorid;
            }
        }

        const result = await pool.query(
            'INSERT INTO inventario (productoid, cantidad, proveedor, proveedorid) VALUES ($1, $2, $3, $4) RETURNING *',
            [productoid, cantidad, proveedor || 'Proveedor General', finalProveedorId]
        );

        await pool.query(
            'UPDATE producto SET stock = stock + $1 WHERE productoid = $2',
            [cantidad, productoid]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

const obtenerProductoPorTitulo = async (req, res) => {
    try {
        const titulo = decodeURIComponent(req.params.titulo);
        const result = await pool.query('SELECT p.*, c.nombrecategoria AS categoria FROM producto p JOIN categoria c ON p.categoriaid = c.categoriaid WHERE p.titulo = $1', [titulo]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

const obtenerReviewProductoPublico = async (req, res) => {
    try {
        const { productoid } = req.params;
        const result = await pool.query(`
            SELECT r.*, u.nombres, u.apellidos, u.email
            FROM resena r
            JOIN usuario u ON r.usuarioid = u.usuarioid
            WHERE r.productoid = $1
        `, [productoid]);

        // Si no hay reseñas, devolver valores por defecto
        if (result.rows.length === 0) {
            return res.status(200).json({ 
                reviews: [], 
                rating: 0, 
                starCount: [0, 0, 0, 0, 0] 
            });
        }

        // Calcula el rating y el número de reseñas por estrellas
        const reviews = result.rows;
        const rating = reviews.reduce((acc, review) => acc + review.estrellas, 0) / reviews.length;
        const starCount = [0, 0, 0, 0, 0];
        reviews.forEach(review => {
            starCount[review.estrellas - 1]++;
        });

        res.status(200).json({ reviews, rating, starCount });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// función para buscar productos

const buscarProductos = async (req, res) => {
    try {
        const { termino } = req.query;
        const query = `
            SELECT 
                p.productoid, 
                p.titulo, 
                p.precio, 
                p.portada,
                c.nombrecategoria
            FROM producto p
            JOIN categoria c ON p.categoriaid = c.categoriaid
            WHERE LOWER(p.titulo) LIKE LOWER($1)
            LIMIT 5
        `;
        const result = await pool.query(query, [`%${termino}%`]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};


module.exports = {
    registrarProducto,
    listarProductos,
    obtenerPortada,
    obtenerProducto,
    actualizarProducto,
    eliminarProducto,
    listarInventarioProducto,
    eliminarInventarioProducto,
    registrarInventarioProducto,
    obtenerProductoPorTitulo,
    obtenerReviewProductoPublico,
    buscarProductos
};
