const { Router } = require('express');
const router = Router();

const { agregarCarritoCliente, obtenerCarritoCliente, eliminarCarritoCliente, incrementarCantidadCarrito, decrementarCantidadCarrito } = require('../controllers/carritoController');

router.post('/agregarCarrito', agregarCarritoCliente);
router.get('/obtenerCarrito/:id', obtenerCarritoCliente);
router.delete('/eliminarCarrito/:id', eliminarCarritoCliente);

// Ruta para incrementar la cantidad de un producto en el carrito
router.put('/carrito/incrementar/:id', incrementarCantidadCarrito);
// Ruta para decrementar la cantidad de un producto en el carrito
router.put('/carrito/decrementar/:id', decrementarCantidadCarrito);
module.exports = router;