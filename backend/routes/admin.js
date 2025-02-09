const { Router } = require('express');
const router = Router();
const { kpi_ganancias_mensuales_admin } = require('../controllers/adminController');
const { authMiddleware } = require('../middlewares/authMiddleware');

router.get('/kpi-ganancias-mensuales', authMiddleware, kpi_ganancias_mensuales_admin);

module.exports = router;
