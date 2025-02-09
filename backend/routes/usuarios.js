const { Router } = require('express');
const router = Router();

const { listarUsuariosConRoles, registerUser, registerUserAdmin, restablecerPassword, solicitarRestablecimiento } = require('../controllers/usuariosController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Ruta endpoint para listar usuarios con sus roles
router.get('/usuarios', authMiddleware, listarUsuariosConRoles);

// Ruta endpoint para registrar un usuario
router.post('/register', registerUser);

// Ruta endpoint para registrar un administrador
router.post('/registerAdmin', registerUserAdmin)

router.post('/forgot-password', solicitarRestablecimiento);

router.post('/reset-password', restablecerPassword);

module.exports = router;
