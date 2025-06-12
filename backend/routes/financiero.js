const { Router } = require('express');
const router = Router();

const {
    // Plan de cuentas
    listarPlanCuentas,
    crearCuentaContable,
    obtenerCuentaContable,
    actualizarCuentaContable,
    
    // Asientos contables
    listarAsientosContables,
    obtenerAsientoContable,
    crearAsientoContable,
    aprobarAsientoContable,
    
    // Flujo de caja
    listarFlujoCaja,
    registrarMovimientoCaja,
    obtenerResumenFlujoCaja,
    
    // Reportes
    obtenerBalanceGeneral,
    obtenerEstadoResultados,

    listarOrdenesPendientesPago
} = require('../controllers/financieroController');

const { authMiddleware } = require('../middlewares/authMiddleware');

// ======================== PLAN DE CUENTAS ========================
router.get('/listar_plan_cuentas', authMiddleware, listarPlanCuentas);
router.get('/obtener_cuenta_contable/:id', authMiddleware, obtenerCuentaContable);
router.post('/crear_cuenta_contable', authMiddleware, crearCuentaContable);
router.put('/actualizar_cuenta_contable/:id', authMiddleware, actualizarCuentaContable);

// ======================== ASIENTOS CONTABLES ========================
router.get('/listar_asientos_contables', authMiddleware, listarAsientosContables);
router.get('/obtener_asiento_contable/:id', authMiddleware, obtenerAsientoContable);
router.post('/crear_asiento_contable', authMiddleware, crearAsientoContable);
router.put('/aprobar_asiento_contable/:id', authMiddleware, aprobarAsientoContable);

// ======================== FLUJO DE CAJA ========================
router.get('/listar_flujo_caja', authMiddleware, listarFlujoCaja);
router.post('/registrar_movimiento_caja', authMiddleware, registrarMovimientoCaja);
router.get('/obtener_resumen_flujo_caja', authMiddleware, obtenerResumenFlujoCaja);

// ======================== ÓRDENES DE COMPRA ========================
router.get('/listar_ordenes_pendientes_pago', authMiddleware, listarOrdenesPendientesPago);

// ======================== REPORTES FINANCIEROS ========================
router.get('/obtener_balance_general', authMiddleware, obtenerBalanceGeneral);
router.get('/obtener_estado_resultados', authMiddleware, obtenerEstadoResultados);

module.exports = router;