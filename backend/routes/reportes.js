const { Router } = require('express');
const router = Router();

const {
    // Reportes de ventas
    reporteVentasPeriodo,
    reporteVentasProductoSimple,
    reporteVentasCliente,
    
    // Reportes de inventario
    reporteStockActual,
    reporteMovimientosInventario,
    
    // Reportes financieros
    reporteCuentasPorCobrar,
    reporteCuentasPorPagar,
    
    // Reportes administrativos
    reporteActividadUsuarios,
    
    // Dashboard
    dashboardReportes,

    obtenerCategorias
} = require('../controllers/reportesController');

const { authMiddleware } = require('../middlewares/authMiddleware');

// ======================== REPORTES DE VENTAS ========================
router.get('/reporte_ventas_periodo', authMiddleware, reporteVentasPeriodo);
router.get('/reporte_ventas_producto', authMiddleware, reporteVentasProductoSimple);
router.get('/reporte_ventas_cliente', authMiddleware, reporteVentasCliente);

// ======================== REPORTES DE INVENTARIO ========================
router.get('/reporte_stock_actual', authMiddleware, reporteStockActual);
router.get('/reporte_movimientos_inventario', authMiddleware, reporteMovimientosInventario);

// ======================== REPORTES FINANCIEROS ========================
router.get('/reporte_cuentas_por_cobrar', authMiddleware, reporteCuentasPorCobrar);
router.get('/reporte_cuentas_por_pagar', authMiddleware, reporteCuentasPorPagar);

// ======================== REPORTES ADMINISTRATIVOS ========================
router.get('/reporte_actividad_usuarios', authMiddleware, reporteActividadUsuarios);

// ======================== DASHBOARD ========================
router.get('/dashboard_reportes', authMiddleware, dashboardReportes);

// ======================== UTILITARIOS ========================
router.get('/obtener_categorias', authMiddleware, obtenerCategorias);

module.exports = router;