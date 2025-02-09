const pool = require('../db/pool');

const listarCategorias = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categoria');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

const buscarCategorias = async (req, res) => {
    const { filter } = req.query;
    try {
        const result = await pool.query('SELECT * FROM categoria WHERE nombrecategoria ILIKE $1', [`%${filter}%`]);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    listarCategorias,
    buscarCategorias
};
