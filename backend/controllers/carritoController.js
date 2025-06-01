const pool = require('../db/pool');

const agregarCarritoCliente = async(req, res) => {
    const { usuarioid, productoid, cantidad, precio } = req.body;

    try {

        const resultRol = await pool.query(
            'SELECT r.nombre FROM rol_usuario ru JOIN rol r ON ru.rolid = r.rolid WHERE ru.usuarioid = $1 AND r.nombre = $2', [usuarioid, 'Cliente']
        );

        if (resultRol.rowCount === 0) {
            return res.status(403).json({ message: 'El usuario no tiene el rol de Cliente' });
        }

        const resultCarrito = await pool.query(
            'SELECT * FROM carrito WHERE usuarioid = $1 AND productoid = $2', [usuarioid, productoid]
        );

        if (resultCarrito.rowCount > 0) {
            return res.status(400).json({ message: 'El producto ya está en el carrito' });
        }


        await pool.query(
            'INSERT INTO carrito (usuarioid, productoid, cantidad, precio) VALUES ($1, $2, $3, $4)', [usuarioid, productoid, cantidad, precio]
        );

        res.status(201).json({ message: 'Producto agregado al carrito exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al agregar producto al carrito' });
    }
};

const obtenerCarritoCliente = async(req, res) => {
    const { id } = req.params;

    // Validación del ID
    if (!id || id === 'null' || id === 'undefined') {
        return res.status(200).json([]);
    }

    // Convertir ID a número
    const usuarioId = parseInt(id);
    if (isNaN(usuarioId)) {
        return res.status(200).json([]);
    }

    try {
        // Verificar rol de cliente
        const resultRol = await pool.query(
            'SELECT r.nombre FROM rol_usuario ru JOIN rol r ON ru.rolid = r.rolid WHERE ru.usuarioid = $1 AND r.nombre = $2', 
            [usuarioId, 'Cliente']
        );

        if (resultRol.rowCount === 0) {
            return res.status(200).json([]);
        }

        // Obtener carrito
        const resultCarrito = await pool.query(
            `SELECT 
                c.carritoid, 
                c.usuarioid, 
                p.*, 
                c.cantidad, 
                c.precio AS precio_carrito, 
                cat.nombrecategoria
             FROM carrito c
             JOIN producto p ON c.productoid = p.productoid
             JOIN categoria cat ON p.categoriaid = cat.categoriaid
             WHERE c.usuarioid = $1`,
            [usuarioId]
        );

        res.status(200).json(resultCarrito.rows);
    } catch (error) {
        console.error('Error en obtenerCarritoCliente:', error);
        return res.status(200).json([]);
    }
};

const eliminarCarritoCliente = async(req, res) => {
    const { id } = req.params;

    try {

        await pool.query(
            'DELETE FROM carrito WHERE carritoid = $1', [id]
        );

        res.status(200).json({ message: 'Producto eliminado del carrito exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar el producto del carrito' });
    }
};

// Incrementar cantidad de un producto en el carrito
const incrementarCantidadCarrito = async(req, res) => {
    const { id } = req.params; // El id del producto en el carrito
    try {
        // Actualizamos la cantidad de un producto en el carrito
        const result = await pool.query('UPDATE carrito SET cantidad = cantidad + 1 WHERE carritoid = $1 RETURNING *', [id]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al incrementar la cantidad del producto');
    }
};

// Decrementar cantidad de un producto en el carrito
const decrementarCantidadCarrito = async(req, res) => {
    const { id } = req.params; // El id del producto en el carrito
    try {
        // Si la cantidad es mayor que 1, decrementamos la cantidad
        const result = await pool.query('UPDATE carrito SET cantidad = cantidad - 1 WHERE carritoid = $1 AND cantidad > 1 RETURNING *', [id]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al decrementar la cantidad del producto');
    }
};



module.exports = {
    agregarCarritoCliente,
    obtenerCarritoCliente,
    eliminarCarritoCliente,
    incrementarCantidadCarrito,
    decrementarCantidadCarrito
};