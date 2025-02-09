const { Router } = require('express');
const router = Router();

const { 
    listarClientes, registrarCliente, obtenerCliente, actualizarCliente, eliminarCliente, obtenerClienteConRol, 
    cambiarPassword, registroDireccionCliente, obtenerDireccionesCliente, cambiarDireccionPrincipalCliente, 
    obtenerDireccionPrincipalCliente, listarDirecciones, obtenerOrdenesCliente, obtenerDetallesCliente, emitirReviewProductoCliente,
    obtenerReviewProductoCliente, obtenerReviewCliente, 
} = require('../controllers/clienteController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Ruta endpoint para listar clientes
router.get('/listar_clientes/:tipo/:filtro?', authMiddleware, listarClientes);

// Ruta endpoint para registrar cliente
router.post('/registrar_cliente', registrarCliente);

// Ruta endpoint para obtener cliente por ID
router.get('/obtener_cliente/:id', authMiddleware, obtenerCliente);

// Ruta endpoint para actualizar cliente
router.put('/actualizar_cliente/:id', authMiddleware, actualizarCliente);

router.post('/cambiar_password/:id', authMiddleware, cambiarPassword);

// Ruta endpoint para eliminar cliente
router.delete('/eliminar_cliente/:id', authMiddleware, eliminarCliente);

// Ruta endpoint para obtener cliente con rol Cliente
router.get('/obtener_cliente_con_rol/:id', authMiddleware, obtenerClienteConRol);

// Ruta endpoint para registrar dirección del cliente
router.post('/registrar_direccion_cliente', authMiddleware, registroDireccionCliente);

router.get('/obtener_direcciones_cliente/:id', authMiddleware, obtenerDireccionesCliente);

router.post('/cambiarDireccionPrincipal', authMiddleware, cambiarDireccionPrincipalCliente);

router.get('/obtener_direccion_principal_cliente/:id', authMiddleware, obtenerDireccionPrincipalCliente);

router.get('/listar_direcciones', authMiddleware, listarDirecciones);

router.get('/obtener_ordenes_cliente/:id', authMiddleware, obtenerOrdenesCliente);

router.get('/obtener_detalles_cliente/:ventaid', authMiddleware, obtenerDetallesCliente);

router.post('/emitir_review_producto_cliente', authMiddleware, emitirReviewProductoCliente);

router.get('/obtener_review_producto_cliente/:productoid', authMiddleware, obtenerReviewProductoCliente);

router.get('/obtener_review_cliente/:usuarioid', authMiddleware, obtenerReviewCliente);

module.exports = router;