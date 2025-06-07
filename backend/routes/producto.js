const { Router } = require('express');
const router = Router();
const { registrarProducto, listarProductos, obtenerPortada, actualizarProducto, eliminarProducto, 
    listarInventarioProducto, eliminarInventarioProducto, registrarInventarioProducto, obtenerProductoPorTitulo,
    obtenerReviewProductoPublico, buscarProductos
} = require('../controllers/productoController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const multiparty = require('connect-multiparty');
const path = multiparty({ uploadDir: './uploads/productos' });

// Ruta endpoint para registrar producto
router.post('/registrar_producto', authMiddleware, path, registrarProducto);

// Ruta endpoint para listar productos
router.get('/listar_productos', authMiddleware, listarProductos);

router.get('/listar_productos_clientes', listarProductos);

// Ruta endpoint para obtener portada
router.get('/obtener_portada/:portada', obtenerPortada);

// Ruta para actualizar un producto
router.put('/actuaizar_producto/:id', authMiddleware, path, actualizarProducto);

// Ruta para eliminar un producto
router.delete('/eliminar_producto/:id', authMiddleware, eliminarProducto);

router.get('/listar_inventario_producto/:id', authMiddleware, listarInventarioProducto);

router.delete('/eliminar_inventario_producto/:id', authMiddleware, eliminarInventarioProducto);

router.post('/registrar_inventario_producto', authMiddleware, registrarInventarioProducto);

router.get('/obtener_producto_por_titulo/:titulo', obtenerProductoPorTitulo);

router.get('/obtener_review_producto_publico/:productoid', obtenerReviewProductoPublico);

router.get('/buscar_productos', buscarProductos);

module.exports = router;
