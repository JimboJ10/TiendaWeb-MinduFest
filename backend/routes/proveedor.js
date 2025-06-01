const { Router } = require('express');
const router = Router();

const {
    listarProveedores,
    obtenerProveedor,
    registrarProveedor,
    actualizarProveedor,
    eliminarProveedor,
    obtenerProductosProveedor,
    obtenerEstadisticasProveedor
} = require('../controllers/proveedorController');

const { authMiddleware } = require('../middlewares/authMiddleware');

// Rutas para gestión de proveedores
router.get('/listar_proveedores', authMiddleware, listarProveedores);
router.get('/obtener_proveedor/:id', authMiddleware, obtenerProveedor);
router.post('/registrar_proveedor', authMiddleware, registrarProveedor);
router.put('/actualizar_proveedor/:id', authMiddleware, actualizarProveedor);
router.delete('/eliminar_proveedor/:id', authMiddleware, eliminarProveedor);
router.get('/productos_proveedor/:id', authMiddleware, obtenerProductosProveedor);
router.get('/estadisticas_proveedor/:id', authMiddleware, obtenerEstadisticasProveedor);

module.exports = router;