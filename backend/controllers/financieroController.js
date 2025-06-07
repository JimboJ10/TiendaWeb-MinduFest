const pool = require('../db/pool');

// ======================== PLAN DE CUENTAS ========================

// Listar plan de cuentas
const listarPlanCuentas = async (req, res) => {
    try {
        const { filtro, tipo, estado } = req.query;
        
        let query = `
            SELECT 
                pc.*,
                padre.nombre as cuenta_padre_nombre
            FROM plan_cuentas pc
            LEFT JOIN plan_cuentas padre ON pc.cuenta_padre = padre.cuentaid
            WHERE 1=1
        `;
        
        const params = [];
        
        if (filtro) {
            query += ` AND (pc.codigo ILIKE $${params.length + 1} OR pc.nombre ILIKE $${params.length + 1})`;
            params.push(`%${filtro}%`);
        }
        
        if (tipo) {
            query += ` AND pc.tipo = $${params.length + 1}`;
            params.push(tipo);
        }
        
        if (estado) {
            query += ` AND pc.estado = $${params.length + 1}`;
            params.push(estado);
        }
        
        query += ` ORDER BY pc.codigo`;
        
        const result = await pool.query(query, params);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error al listar plan de cuentas:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

const obtenerCuentaContable = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(`
            SELECT 
                pc.*,
                padre.nombre as cuenta_padre_nombre,
                padre.codigo as cuenta_padre_codigo
            FROM plan_cuentas pc
            LEFT JOIN plan_cuentas padre ON pc.cuenta_padre = padre.cuentaid
            WHERE pc.cuentaid = $1
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cuenta contable no encontrada' });
        }
        
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Error al obtener cuenta contable:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Crear cuenta contable
const crearCuentaContable = async (req, res) => {
    try {
        const {
            codigo,
            nombre,
            tipo,
            subtipo,
            nivel,
            cuenta_padre,
            descripcion
        } = req.body;

        // Validar que el código no exista
        const existeCodigo = await pool.query(
            'SELECT cuentaid FROM plan_cuentas WHERE codigo = $1',
            [codigo]
        );

        if (existeCodigo.rows.length > 0) {
            return res.status(400).json({ error: 'El código de cuenta ya existe' });
        }

        const result = await pool.query(`
            INSERT INTO plan_cuentas (
                codigo, nombre, tipo, subtipo, nivel, 
                cuenta_padre, descripcion
            ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING *
        `, [codigo, nombre, tipo, subtipo, nivel, cuenta_padre, descripcion]);

        res.status(201).json({
            message: 'Cuenta contable creada con éxito',
            cuenta: result.rows[0]
        });
    } catch (err) {
        console.error('Error al crear cuenta contable:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Actualizar cuenta contable
const actualizarCuentaContable = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            codigo,
            nombre,
            tipo,
            subtipo,
            descripcion,
            estado
        } = req.body;

        await pool.query(`
            UPDATE plan_cuentas SET
                codigo = $1,
                nombre = $2,
                tipo = $3,
                subtipo = $4,
                descripcion = $5,
                estado = $6
            WHERE cuentaid = $7
        `, [codigo, nombre, tipo, subtipo, descripcion, estado, id]);

        res.status(200).json({ message: 'Cuenta contable actualizada con éxito' });
    } catch (err) {
        console.error('Error al actualizar cuenta contable:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// ======================== ASIENTOS CONTABLES ========================

// Listar asientos contables
const listarAsientosContables = async (req, res) => {
    try {
        const { desde, hasta, tipo_documento, estado } = req.query;
        
        let query = `
            SELECT 
                ac.*,
                u.nombres as usuario_nombres,
                u.apellidos as usuario_apellidos
            FROM asiento_contable ac
            LEFT JOIN usuario u ON ac.usuarioid = u.usuarioid
            WHERE 1=1
        `;
        
        const params = [];
        
        if (desde) {
            query += ` AND ac.fecha_asiento >= $${params.length + 1}`;
            params.push(desde);
        }
        
        if (hasta) {
            query += ` AND ac.fecha_asiento <= $${params.length + 1}`;
            params.push(hasta);
        }
        
        if (tipo_documento) {
            query += ` AND ac.tipo_documento = $${params.length + 1}`;
            params.push(tipo_documento);
        }
        
        if (estado) {
            query += ` AND ac.estado = $${params.length + 1}`;
            params.push(estado);
        }
        
        query += ` ORDER BY ac.fecha_asiento DESC, ac.numero_asiento DESC`;
        
        const result = await pool.query(query, params);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error al listar asientos contables:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Obtener asiento contable con detalles
const obtenerAsientoContable = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Obtener el asiento
        const asientoResult = await pool.query(`
            SELECT 
                ac.*,
                u.nombres as usuario_nombres,
                u.apellidos as usuario_apellidos
            FROM asiento_contable ac
            LEFT JOIN usuario u ON ac.usuarioid = u.usuarioid
            WHERE ac.asientoid = $1
        `, [id]);
        
        if (asientoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Asiento contable no encontrado' });
        }
        
        // Obtener los detalles
        const detallesResult = await pool.query(`
            SELECT 
                da.*,
                pc.codigo as cuenta_codigo,
                pc.nombre as cuenta_nombre,
                pc.tipo as cuenta_tipo
            FROM detalle_asiento da
            JOIN plan_cuentas pc ON da.cuentaid = pc.cuentaid
            WHERE da.asientoid = $1
            ORDER BY da.detalleasientoid
        `, [id]);
        
        const asiento = asientoResult.rows[0];
        asiento.detalles = detallesResult.rows;
        
        res.status(200).json(asiento);
    } catch (err) {
        console.error('Error al obtener asiento contable:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Crear asiento contable
const crearAsientoContable = async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const {
            fecha_asiento,
            descripcion,
            tipo_asiento = 'Manual',
            referencia_documento,
            tipo_documento,
            detalles // Array: [{ cuentaid, debe, haber, descripcion }]
        } = req.body;
        
        const usuarioid = req.user.id;
        
        // Validar que haya detalles
        if (!detalles || detalles.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Debe agregar al menos un detalle al asiento' });
        }
        
        // Calcular totales y validar balance
        let total_debe = 0;
        let total_haber = 0;
        
        detalles.forEach(detalle => {
            total_debe += parseFloat(detalle.debe || 0);
            total_haber += parseFloat(detalle.haber || 0);
        });
        
        if (Math.abs(total_debe - total_haber) > 0.01) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'El asiento no está balanceado. Debe = Haber' });
        }
        
        // Generar número de asiento
        const numero_asiento = `AS-${Date.now()}`;
        
        // Crear el asiento
        const asientoResult = await client.query(`
            INSERT INTO asiento_contable (
                numero_asiento, fecha_asiento, descripcion, 
                tipo_asiento, referencia_documento, tipo_documento,
                total_debe, total_haber, usuarioid
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            RETURNING asientoid
        `, [
            numero_asiento, fecha_asiento, descripcion,
            tipo_asiento, referencia_documento, tipo_documento,
            total_debe, total_haber, usuarioid
        ]);
        
        const asientoid = asientoResult.rows[0].asientoid;
        
        // Insertar detalles
        for (const detalle of detalles) {
            await client.query(`
                INSERT INTO detalle_asiento (
                    asientoid, cuentaid, debe, haber, descripcion, referencia
                ) VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                asientoid, detalle.cuentaid, detalle.debe || 0,
                detalle.haber || 0, detalle.descripcion, detalle.referencia
            ]);
        }
        
        await client.query('COMMIT');
        
        res.status(201).json({
            message: 'Asiento contable creado con éxito',
            asientoid,
            numero_asiento
        });
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al crear asiento contable:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    } finally {
        client.release();
    }
};

// Aprobar asiento contable
const aprobarAsientoContable = async (req, res) => {
    try {
        const { id } = req.params;
        
        await pool.query(`
            UPDATE asiento_contable SET
                estado = 'Aprobado',
                fecha_aprobacion = CURRENT_TIMESTAMP
            WHERE asientoid = $1 AND estado = 'Pendiente'
        `, [id]);
        
        res.status(200).json({ message: 'Asiento contable aprobado con éxito' });
    } catch (err) {
        console.error('Error al aprobar asiento:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// ======================== FLUJO DE CAJA ========================

// Listar flujo de caja
const listarFlujoCaja = async (req, res) => {
    try {
        const { desde, hasta, tipo, categoria } = req.query;
        
        let query = `
            SELECT 
                fc.*,
                pc.codigo as cuenta_codigo,
                pc.nombre as cuenta_nombre,
                u.nombres as usuario_nombres,
                u.apellidos as usuario_apellidos
            FROM flujo_caja fc
            LEFT JOIN plan_cuentas pc ON fc.cuentaid = pc.cuentaid
            LEFT JOIN usuario u ON fc.usuarioid = u.usuarioid
            WHERE 1=1
        `;
        
        const params = [];
        
        if (desde) {
            query += ` AND fc.fecha >= $${params.length + 1}`;
            params.push(desde);
        }
        
        if (hasta) {
            query += ` AND fc.fecha <= $${params.length + 1}`;
            params.push(hasta);
        }
        
        if (tipo) {
            query += ` AND fc.tipo = $${params.length + 1}`;
            params.push(tipo);
        }
        
        if (categoria) {
            query += ` AND fc.categoria = $${params.length + 1}`;
            params.push(categoria);
        }
        
        query += ` ORDER BY fc.fecha DESC, fc.fecha_creacion DESC`;
        
        const result = await pool.query(query, params);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error al listar flujo de caja:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Registrar movimiento de caja
const registrarMovimientoCaja = async (req, res) => {
    try {
        const {
            fecha,
            tipo,
            categoria,
            concepto,
            monto,
            metodo_pago,
            referencia_documento,
            cuentaid,
            observaciones
        } = req.body;
        
        const usuarioid = req.user.id;
        
        const result = await pool.query(`
            INSERT INTO flujo_caja (
                fecha, tipo, categoria, concepto, monto,
                metodo_pago, referencia_documento, cuentaid,
                usuarioid, observaciones
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `, [
            fecha, tipo, categoria, concepto, monto,
            metodo_pago, referencia_documento, cuentaid,
            usuarioid, observaciones
        ]);
        
        res.status(201).json({
            message: 'Movimiento de caja registrado con éxito',
            movimiento: result.rows[0]
        });
    } catch (err) {
        console.error('Error al registrar movimiento:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Obtener resumen de flujo de caja
const obtenerResumenFlujoCaja = async (req, res) => {
    try {
        const { desde, hasta } = req.query;
        
        let filtroFecha = '';
        const params = [];
        
        if (desde && hasta) {
            filtroFecha = 'WHERE fecha BETWEEN $1 AND $2';
            params.push(desde, hasta);
        }
        
        const resumenResult = await pool.query(`
            SELECT 
                SUM(CASE WHEN tipo = 'Ingreso' THEN monto ELSE 0 END) as total_ingresos,
                SUM(CASE WHEN tipo = 'Egreso' THEN monto ELSE 0 END) as total_egresos,
                SUM(CASE WHEN tipo = 'Ingreso' THEN monto ELSE -monto END) as saldo_neto,
                COUNT(*) as total_movimientos
            FROM flujo_caja ${filtroFecha}
        `, params);
        
        // Obtener ingresos por categoría
        const ingresosCategoriaResult = await pool.query(`
            SELECT 
                categoria,
                SUM(monto) as total
            FROM flujo_caja 
            ${filtroFecha} ${filtroFecha ? 'AND' : 'WHERE'} tipo = 'Ingreso'
            GROUP BY categoria
            ORDER BY total DESC
        `, params);
        
        // Obtener egresos por categoría
        const egresosCategoriaResult = await pool.query(`
            SELECT 
                categoria,
                SUM(monto) as total
            FROM flujo_caja 
            ${filtroFecha} ${filtroFecha ? 'AND' : 'WHERE'} tipo = 'Egreso'
            GROUP BY categoria
            ORDER BY total DESC
        `, params);
        
        res.status(200).json({
            resumen: resumenResult.rows[0],
            ingresos_por_categoria: ingresosCategoriaResult.rows,
            egresos_por_categoria: egresosCategoriaResult.rows
        });
    } catch (err) {
        console.error('Error al obtener resumen:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// ======================== REPORTES FINANCIEROS ========================

// Balance General
const obtenerBalanceGeneral = async (req, res) => {
    try {
        const { fecha_corte } = req.query;
        const fechaCorte = fecha_corte || new Date().toISOString().split('T')[0];
        
        const result = await pool.query(`
            SELECT 
                pc.tipo,
                pc.subtipo,
                pc.codigo,
                pc.nombre,
                COALESCE(SUM(
                    CASE 
                        WHEN pc.tipo IN ('Activo', 'Gasto') THEN da.debe - da.haber
                        ELSE da.haber - da.debe
                    END
                ), 0) as saldo
            FROM plan_cuentas pc
            LEFT JOIN detalle_asiento da ON pc.cuentaid = da.cuentaid
            LEFT JOIN asiento_contable ac ON da.asientoid = ac.asientoid 
                AND ac.fecha_asiento <= $1 AND ac.estado = 'Aprobado'
            WHERE pc.estado = 'Activo'
            GROUP BY pc.cuentaid, pc.tipo, pc.subtipo, pc.codigo, pc.nombre
            HAVING COALESCE(SUM(
                CASE 
                    WHEN pc.tipo IN ('Activo', 'Gasto') THEN da.debe - da.haber
                    ELSE da.haber - da.debe
                END
            ), 0) != 0
            ORDER BY pc.codigo
        `, [fechaCorte]);
        
        // Organizar por tipo de cuenta
        const balance = {
            activos: result.rows.filter(row => row.tipo === 'Activo'),
            pasivos: result.rows.filter(row => row.tipo === 'Pasivo'),
            patrimonio: result.rows.filter(row => row.tipo === 'Patrimonio'),
            fecha_corte: fechaCorte
        };
        
        // Calcular totales
        balance.total_activos = balance.activos.reduce((sum, cuenta) => sum + parseFloat(cuenta.saldo), 0);
        balance.total_pasivos = balance.pasivos.reduce((sum, cuenta) => sum + parseFloat(cuenta.saldo), 0);
        balance.total_patrimonio = balance.patrimonio.reduce((sum, cuenta) => sum + parseFloat(cuenta.saldo), 0);
        
        res.status(200).json(balance);
    } catch (err) {
        console.error('Error al obtener balance general:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Estado de Resultados
const obtenerEstadoResultados = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;
        const fechaInicio = fecha_inicio || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
        const fechaFin = fecha_fin || new Date().toISOString().split('T')[0];
        
        const result = await pool.query(`
            SELECT 
                pc.tipo,
                pc.subtipo,
                pc.codigo,
                pc.nombre,
                COALESCE(SUM(da.haber - da.debe), 0) as saldo
            FROM plan_cuentas pc
            LEFT JOIN detalle_asiento da ON pc.cuentaid = da.cuentaid
            LEFT JOIN asiento_contable ac ON da.asientoid = ac.asientoid 
                AND ac.fecha_asiento BETWEEN $1 AND $2 AND ac.estado = 'Aprobado'
            WHERE pc.tipo IN ('Ingreso', 'Gasto') AND pc.estado = 'Activo'
            GROUP BY pc.cuentaid, pc.tipo, pc.subtipo, pc.codigo, pc.nombre
            HAVING COALESCE(SUM(da.haber - da.debe), 0) != 0
            ORDER BY pc.codigo
        `, [fechaInicio, fechaFin]);
        
        // Organizar por tipo
        const estadoResultados = {
            ingresos: result.rows.filter(row => row.tipo === 'Ingreso'),
            gastos: result.rows.filter(row => row.tipo === 'Gasto'),
            periodo: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
        };
        
        // Calcular totales
        estadoResultados.total_ingresos = estadoResultados.ingresos.reduce((sum, cuenta) => sum + parseFloat(cuenta.saldo), 0);
        estadoResultados.total_gastos = estadoResultados.gastos.reduce((sum, cuenta) => sum + Math.abs(parseFloat(cuenta.saldo)), 0);
        estadoResultados.utilidad_neta = estadoResultados.total_ingresos - estadoResultados.total_gastos;
        
        res.status(200).json(estadoResultados);
    } catch (err) {
        console.error('Error al obtener estado de resultados:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// ======================== ASIENTOS AUTOMÁTICOS ========================

// Crear asiento automático para venta
const crearAsientoVenta = async (ventaid) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Obtener información de la venta
        const ventaResult = await client.query(`
            SELECT v.*, u.nombres, u.apellidos
            FROM venta v
            JOIN usuario u ON v.usuarioid = u.usuarioid
            WHERE v.ventaid = $1
        `, [ventaid]);
        
        if (ventaResult.rows.length === 0) {
            throw new Error('Venta no encontrada');
        }
        
        const venta = ventaResult.rows[0];
        const numero_asiento = `AS-VTA-${ventaid}`;
        
        // Crear el asiento
        const asientoResult = await client.query(`
            INSERT INTO asiento_contable (
                numero_asiento, fecha_asiento, descripcion, 
                tipo_asiento, referencia_documento, tipo_documento,
                total_debe, total_haber, estado
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            RETURNING asientoid
        `, [
            numero_asiento, 
            venta.fecha.toISOString().split('T')[0],
            `Venta ${venta.nventa} - Cliente: ${venta.nombres} ${venta.apellidos}`,
            'Automatico', 
            ventaid, 
            'Venta',
            venta.subtotal, 
            venta.subtotal,
            'Aprobado'
        ]);
        
        const asientoid = asientoResult.rows[0].asientoid;
        
        // Debitar Caja (o Cuentas por Cobrar)
        await client.query(`
            INSERT INTO detalle_asiento (
                asientoid, cuentaid, debe, haber, descripcion
            ) VALUES ($1, (SELECT cuentaid FROM plan_cuentas WHERE codigo = '1101'), $2, 0, $3)
        `, [asientoid, venta.subtotal, 'Ingreso por venta']);
        
        // Acreditar Ventas
        await client.query(`
            INSERT INTO detalle_asiento (
                asientoid, cuentaid, debe, haber, descripcion
            ) VALUES ($1, (SELECT cuentaid FROM plan_cuentas WHERE codigo = '4101'), 0, $2, $3)
        `, [asientoid, venta.subtotal, 'Venta de productos']);
        
        // Registrar en flujo de caja
        await client.query(`
            INSERT INTO flujo_caja (
                fecha, tipo, categoria, concepto, monto,
                referencia_documento, cuentaid
            ) VALUES ($1, 'Ingreso', 'Ventas', $2, $3, $4, 
                (SELECT cuentaid FROM plan_cuentas WHERE codigo = '1101'))
        `, [
            venta.fecha.toISOString().split('T')[0],
            `Venta ${venta.nventa}`,
            venta.subtotal,
            ventaid
        ]);
        
        await client.query('COMMIT');
        return asientoid;
        
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// Crear asiento automático para compra
const crearAsientoCompra = async (ordencompraid) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Obtener información de la orden de compra
        const ordenResult = await client.query(`
            SELECT oc.*, p.nombre as proveedor_nombre
            FROM orden_compra oc
            JOIN proveedor p ON oc.proveedorid = p.proveedorid
            WHERE oc.ordencompraid = $1
        `, [ordencompraid]);
        
        if (ordenResult.rows.length === 0) {
            throw new Error('Orden de compra no encontrada');
        }
        
        const orden = ordenResult.rows[0];
        const numero_asiento = `AS-CMP-${ordencompraid}`;
        
        // Crear el asiento
        const asientoResult = await client.query(`
            INSERT INTO asiento_contable (
                numero_asiento, fecha_asiento, descripcion, 
                tipo_asiento, referencia_documento, tipo_documento,
                total_debe, total_haber, estado
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            RETURNING asientoid
        `, [
            numero_asiento, 
            orden.fecha_orden.toISOString().split('T')[0],
            `Compra ${orden.numero_orden} - Proveedor: ${orden.proveedor_nombre}`,
            'Automatico', 
            ordencompraid, 
            'Compra',
            orden.total, 
            orden.total,
            'Aprobado'
        ]);
        
        const asientoid = asientoResult.rows[0].asientoid;
        
        // Debitar Inventarios
        await client.query(`
            INSERT INTO detalle_asiento (
                asientoid, cuentaid, debe, haber, descripcion
            ) VALUES ($1, (SELECT cuentaid FROM plan_cuentas WHERE codigo = '1104'), $2, 0, $3)
        `, [asientoid, orden.total, 'Compra de inventario']);
        
        // Acreditar Cuentas por Pagar (o Caja si es pago inmediato)
        await client.query(`
            INSERT INTO detalle_asiento (
                asientoid, cuentaid, debe, haber, descripcion
            ) VALUES ($1, (SELECT cuentaid FROM plan_cuentas WHERE codigo = '2101'), 0, $2, $3)
        `, [asientoid, orden.total, `Deuda con proveedor ${orden.proveedor_nombre}`]);
        
        // Registrar en flujo de caja como egreso
        await client.query(`
            INSERT INTO flujo_caja (
                fecha, tipo, categoria, concepto, monto,
                referencia_documento, cuentaid
            ) VALUES ($1, 'Egreso', 'Compras', $2, $3, $4, 
                (SELECT cuentaid FROM plan_cuentas WHERE codigo = '2101'))
        `, [
            orden.fecha_orden.toISOString().split('T')[0],
            `Compra ${orden.numero_orden}`,
            orden.total,
            ordencompraid
        ]);
        
        await client.query('COMMIT');
        return asientoid;
        
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

module.exports = {
    // Plan de cuentas
    listarPlanCuentas,
    obtenerCuentaContable,
    crearCuentaContable,
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
    
    // Asientos automáticos
    crearAsientoVenta,
    crearAsientoCompra
};