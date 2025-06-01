const { Router } = require('express');
const router = Router();

const {
    listarOrdenesCompra,
    obtenerOrdenCompra,
    crearOrdenCompra,
    actualizarOrdenCompra,
    cambiarEstadoOrden,
    recibirProductos,
    cancelarOrdenCompra,
    obtenerEstadisticasOrdenes,
    obtenerEstadosOrden
} = require('../controllers/ordenCompraController');

const { authMiddleware } = require('../middlewares/authMiddleware');

// Rutas para gestión de órdenes de compra
router.get('/listar_ordenes_compra', authMiddleware, listarOrdenesCompra);
router.get('/obtener_orden_compra/:id', authMiddleware, obtenerOrdenCompra);
router.post('/crear_orden_compra', authMiddleware, crearOrdenCompra);
router.put('/actualizar_orden_compra/:id', authMiddleware, actualizarOrdenCompra);
router.put('/cambiar_estado_orden/:id', authMiddleware, cambiarEstadoOrden);
router.post('/recibir_productos/:id', authMiddleware, recibirProductos);
router.put('/cancelar_orden_compra/:id', authMiddleware, cancelarOrdenCompra);
router.get('/estadisticas_ordenes_compra', authMiddleware, obtenerEstadisticasOrdenes);
router.get('/estados_orden_compra', authMiddleware, obtenerEstadosOrden);

module.exports = router;