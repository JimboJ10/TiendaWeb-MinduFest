const { Router } = require('express');
const router = Router();

const { login } = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Ruta endpoint para el login
router.post('/login',  login);

module.exports = router;
