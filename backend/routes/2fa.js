const express = require('express');
const router = express.Router();
const { 
    configurar2FA,
    verificar2FA,
    cambiarEstado2FA,
    obtenerEstado2FA
} = require('../controllers/2faController');
const { authMiddleware } = require('../middlewares/authMiddleware');

router.post('/2fa/configurar', authMiddleware, configurar2FA);
router.post('/2fa/verificar', verificar2FA);
router.post('/2fa/cambiar-estado', authMiddleware, cambiarEstado2FA);
router.get('/2fa/estado/:email', authMiddleware, obtenerEstado2FA);

module.exports = router;