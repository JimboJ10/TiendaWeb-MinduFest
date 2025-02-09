const { Router } = require('express');
const router = Router();

const { registrarVenta, ObtenerVentas, enviarCorreoCompraCliente, obtenerEstadosVenta, actualizarEstadoVenta } = require('../controllers/nventaController');
const { authMiddleware } = require('../middlewares/authMiddleware');

router.post('/registrar_venta', authMiddleware, registrarVenta);
router.get('/obtener_ventas/:desde?/:hasta?', authMiddleware, ObtenerVentas);
router.post('/enviar_correo_compra/:ventaid', authMiddleware, enviarCorreoCompraCliente);
router.get('/estados-venta', authMiddleware, obtenerEstadosVenta);
router.put('/venta-estado/:ventaid', authMiddleware, actualizarEstadoVenta);

module.exports = router;