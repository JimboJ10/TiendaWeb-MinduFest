const { Router } = require('express');
const router = Router();

const {
    listarEmpleados,
    obtenerEmpleado,
    crearEmpleado,
    actualizarEmpleado,
    darBajaEmpleado,
    listarDepartamentos,
    listarCargos,
    listarRoles,
    listarPermisos,
    obtenerEstadisticasEmpleados,
    obtenerHistorialCargos,
    obtenerHistorialSalarios,

    crearRol,
    obtenerRol,
    actualizarRol,
    eliminarRol,
    obtenerEmpleadosPorRol,

    crearPermiso,
    obtenerPermiso,
    actualizarPermiso,
    eliminarPermiso
} = require('../controllers/empleadosContoller');

const { authMiddleware } = require('../middlewares/authMiddleware');

// ======================== GESTIÓN DE EMPLEADOS ========================
router.get('/listar_empleados', authMiddleware, listarEmpleados);
router.get('/obtener_empleado/:id', authMiddleware, obtenerEmpleado);
router.post('/crear_empleado', authMiddleware, crearEmpleado);
router.put('/actualizar_empleado/:id', authMiddleware, actualizarEmpleado);
router.put('/dar_baja_empleado/:id', authMiddleware, darBajaEmpleado);

// ======================== DATOS AUXILIARES ========================
router.get('/listar_departamentos', authMiddleware, listarDepartamentos);
router.get('/listar_cargos', authMiddleware, listarCargos);
router.get('/listar_roles', authMiddleware, listarRoles);
router.get('/listar_permisos', authMiddleware, listarPermisos);

// ======================== ESTADÍSTICAS ========================
router.get('/estadisticas_empleados', authMiddleware, obtenerEstadisticasEmpleados);

// ======================== HISTORIAL ========================
router.get('/obtener_historial_salarios/:id', authMiddleware, obtenerHistorialSalarios);
router.get('/obtener_historial_cargos/:id', authMiddleware, obtenerHistorialCargos);

// ======================== GESTIÓN DE ROLES ========================
router.post('/crear_rol', authMiddleware, crearRol);
router.get('/obtener_rol/:id', authMiddleware, obtenerRol);
router.put('/actualizar_rol/:id', authMiddleware, actualizarRol);
router.delete('/eliminar_rol/:id', authMiddleware, eliminarRol);
router.get('/obtener_empleados_por_rol/:rolid', authMiddleware, obtenerEmpleadosPorRol);

// ======================== GESTIÓN DE PERMISOS ========================
router.post('/crear_permiso', authMiddleware, crearPermiso);
router.get('/obtener_permiso/:id', authMiddleware, obtenerPermiso);
router.put('/actualizar_permiso/:id', authMiddleware, actualizarPermiso);
router.delete('/eliminar_permiso/:id', authMiddleware, eliminarPermiso);

module.exports = router;