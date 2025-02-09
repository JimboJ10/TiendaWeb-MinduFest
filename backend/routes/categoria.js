const { Router } = require('express');
const router = Router();
const { listarCategorias, buscarCategorias } = require('../controllers/categoriaController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Ruta endpoint para listar categorías
router.get('/categorias',  listarCategorias);

router.get('/buscar_categorias', buscarCategorias);

module.exports = router;
