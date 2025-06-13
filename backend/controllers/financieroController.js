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
            WHERE pc.estado = 'Activo'
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
        
        // VERSIÓN SIMPLIFICADA BASADA EN FLUJO DE CAJA
        const result = await pool.query(`
            WITH saldos_caja AS (
                SELECT 
                    SUM(CASE WHEN tipo = 'Ingreso' THEN monto ELSE -monto END) as efectivo_bancos
                FROM flujo_caja 
                WHERE fecha <= $1 AND estado = 'Confirmado'
            ),
            valor_inventario AS (
                SELECT 
                    COALESCE(SUM(p.precio * p.stock), 0) as inventario
                FROM producto p 
                WHERE p.stock > 0
            ),
            cuentas_por_pagar AS (
                SELECT 
                    COALESCE(SUM(
                        oc.total - COALESCE(
                            (SELECT SUM(fc.monto) 
                             FROM flujo_caja fc 
                             WHERE fc.referencia_documento = oc.numero_orden 
                             AND fc.tipo = 'Egreso' 
                             AND fc.categoria = 'Compras'
                             AND fc.estado = 'Confirmado'), 0)
                    ), 0) as deudas_proveedores
                FROM orden_compra oc
                WHERE oc.estado NOT IN ('Cancelada', 'Devuelta')
                AND oc.fecha_orden <= $1
            )
            SELECT 
                sc.efectivo_bancos,
                vi.inventario,
                ccp.deudas_proveedores,
                (sc.efectivo_bancos + vi.inventario) as total_activos,
                ccp.deudas_proveedores as total_pasivos,
                ((sc.efectivo_bancos + vi.inventario) - ccp.deudas_proveedores) as patrimonio_neto
            FROM saldos_caja sc
            CROSS JOIN valor_inventario vi
            CROSS JOIN cuentas_por_pagar ccp
        `, [fechaCorte]);
        
        const datos = result.rows[0];
        
        // Organizar datos para el frontend
        const balance = {
            activos_corrientes: [
                {
                    codigo: '1102',
                    nombre: 'Bancos (PayPal)',
                    saldo: parseFloat(datos.efectivo_bancos || 0)
                },
                {
                    codigo: '1104',
                    nombre: 'Inventarios',
                    saldo: parseFloat(datos.inventario || 0)
                }
            ],
            activos_no_corrientes: [],
            pasivos_corrientes: [
                {
                    codigo: '2101',
                    nombre: 'Cuentas por Pagar',
                    saldo: parseFloat(datos.deudas_proveedores || 0)
                }
            ],
            pasivos_no_corrientes: [],
            patrimonio: [
                {
                    codigo: '3101',
                    nombre: 'Patrimonio Neto',
                    saldo: parseFloat(datos.patrimonio_neto || 0)
                }
            ],
            totales: {
                total_activos_corrientes: parseFloat(datos.efectivo_bancos || 0) + parseFloat(datos.inventario || 0),
                total_activos_no_corrientes: 0,
                total_activos: parseFloat(datos.total_activos || 0),
                total_pasivos_corrientes: parseFloat(datos.deudas_proveedores || 0),
                total_pasivos_no_corrientes: 0,
                total_pasivos: parseFloat(datos.deudas_proveedores || 0),
                total_patrimonio: parseFloat(datos.patrimonio_neto || 0),
                total_pasivos_patrimonio: parseFloat(datos.deudas_proveedores || 0) + parseFloat(datos.patrimonio_neto || 0)
            },
            fecha_corte: fechaCorte,
            balanceado: Math.abs(parseFloat(datos.total_activos || 0) - (parseFloat(datos.deudas_proveedores || 0) + parseFloat(datos.patrimonio_neto || 0))) < 0.01,
            diferencia: parseFloat(datos.total_activos || 0) - (parseFloat(datos.deudas_proveedores || 0) + parseFloat(datos.patrimonio_neto || 0))
        };
        
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
        
        // VERSIÓN SIMPLIFICADA BASADA EN FLUJO DE CAJA
        const result = await pool.query(`
            SELECT 
                categoria,
                tipo,
                SUM(monto) as total
            FROM flujo_caja 
            WHERE fecha BETWEEN $1 AND $2 
            AND estado = 'Confirmado'
            AND categoria IN ('Ventas', 'Ingresos por Envío', 'Comisiones PayPal', 'Gastos Administrativos', 'Compras')
            GROUP BY categoria, tipo
            ORDER BY tipo DESC, categoria
        `, [fechaInicio, fechaFin]);
        
        // Organizar datos
        const ingresos_operacionales = [];
        const gastos_operacionales = [];
        
        result.rows.forEach(row => {
            if (row.tipo === 'Ingreso') {
                ingresos_operacionales.push({
                    codigo: row.categoria === 'Ventas' ? '4101' : '4103',
                    nombre: row.categoria,
                    total: parseFloat(row.total)
                });
            } else {
                gastos_operacionales.push({
                    codigo: row.categoria === 'Comisiones PayPal' ? '5105' : '5102',
                    nombre: row.categoria,
                    total: parseFloat(row.total)
                });
            }
        });
        
        // Calcular totales
        const total_ingresos_operacionales = ingresos_operacionales.reduce((sum, item) => sum + item.total, 0);
        const total_gastos_operacionales = gastos_operacionales.reduce((sum, item) => sum + item.total, 0);
        const utilidad_neta = total_ingresos_operacionales - total_gastos_operacionales;
        
        const estadoResultados = {
            ingresos_operacionales,
            ingresos_no_operacionales: [],
            costo_ventas: [],
            gastos_operacionales,
            gastos_no_operacionales: [],
            totales: {
                total_ingresos_operacionales,
                total_ingresos_no_operacionales: 0,
                total_ingresos: total_ingresos_operacionales,
                total_costo_ventas: 0,
                utilidad_bruta: total_ingresos_operacionales,
                total_gastos_operacionales,
                utilidad_operacional: total_ingresos_operacionales - total_gastos_operacionales,
                total_gastos_no_operacionales: 0,
                total_gastos: total_gastos_operacionales,
                utilidad_neta
            },
            ratios: {
                margen_bruto: total_ingresos_operacionales > 0 ? (total_ingresos_operacionales / total_ingresos_operacionales) * 100 : 0,
                margen_operacional: total_ingresos_operacionales > 0 ? ((total_ingresos_operacionales - total_gastos_operacionales) / total_ingresos_operacionales) * 100 : 0,
                margen_neto: total_ingresos_operacionales > 0 ? (utilidad_neta / total_ingresos_operacionales) * 100 : 0
            },
            periodo: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
        };
        
        res.status(200).json(estadoResultados);
    } catch (err) {
        console.error('Error al obtener estado de resultados:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// ======================== ASIENTOS AUTOMÁTICOS ========================

// Crear asiento automático para venta
const crearAsientoVenta = async (ventaid) => {
    try {
        // 1. Crear movimientos de flujo de caja
        await crearMovimientosFlujoCajaVenta(ventaid);
        
        // 2. Crear asiento contable
        await crearAsientoContableVenta(ventaid);
        
        console.log(`✅ Venta ${ventaid} procesada: flujo de caja + asiento contable`);
        
    } catch (error) {
        console.error(`❌ Error al procesar venta ${ventaid}:`, error);
        throw error;
    }
};

// Crear movimientos de flujo de caja para venta
const crearMovimientosFlujoCajaVenta = async (ventaid) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Obtener información completa de la venta con transaccion
        const ventaResult = await client.query(`
            SELECT 
                v.ventaid, 
                v.nventa, 
                v.subtotal, 
                v.envioprecio,
                v.fecha,
                v.transaccion,  -- ID de PayPal
                v.usuarioid,    -- AGREGAR USUARIOID DE LA VENTA
                u.nombres, 
                u.apellidos
            FROM venta v
            JOIN usuario u ON v.usuarioid = u.usuarioid
            WHERE v.ventaid = $1
        `, [ventaid]);
        
        if (ventaResult.rows.length === 0) {
            throw new Error('Venta no encontrada');
        }
        
        const venta = ventaResult.rows[0];
        
        // SEPARAR CONCEPTOS PARA MEJOR CONTROL CONTABLE
        const total_venta = parseFloat(venta.subtotal);
        const costo_envio = parseFloat(venta.envioprecio || 0);
        const comision_paypal = (total_venta + costo_envio) * 0.035; // 3.5% sobre el total
        
        // OBTENER EL ID DEL USUARIO CLIENTE
        const usuarioid_cliente = venta.usuarioid;
        
        // 1. REGISTRAR INGRESO BRUTO POR VENTA DE PRODUCTOS
        if (total_venta > 0) {
            await client.query(`
                INSERT INTO flujo_caja (
                    fecha, tipo, categoria, concepto, monto,
                    metodo_pago, referencia_documento, usuarioid, estado
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
                venta.fecha.toISOString().split('T')[0],
                'Ingreso',
                'Ventas', 
                `Venta productos ${venta.nventa} - ${venta.nombres} ${venta.apellidos}`,
                total_venta,
                'PayPal',                 
                venta.transaccion,        
                usuarioid_cliente,        
                'Confirmado'              
            ]);
        }
        
        // 2. REGISTRAR INGRESO POR ENVÍO (si existe)
        if (costo_envio > 0) {
            await client.query(`
                INSERT INTO flujo_caja (
                    fecha, tipo, categoria, concepto, monto,
                    metodo_pago, referencia_documento, usuarioid, estado
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
                venta.fecha.toISOString().split('T')[0],
                'Ingreso',
                'Ingresos por Envío', 
                `Costo envío ${venta.nventa} - ${venta.nombres} ${venta.apellidos}`,
                costo_envio,
                'PayPal',                 
                venta.transaccion,        
                usuarioid_cliente,        
                'Confirmado'              
            ]);
        }
        
        // 3. REGISTRAR GASTO POR COMISIÓN PAYPAL
        if (comision_paypal > 0) {
            await client.query(`
                INSERT INTO flujo_caja (
                    fecha, tipo, categoria, concepto, monto,
                    metodo_pago, referencia_documento, usuarioid, estado
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
                venta.fecha.toISOString().split('T')[0],
                'Egreso',
                'Comisiones PayPal', 
                `Comisión PayPal ${venta.nventa} (3.5%)`,
                comision_paypal,
                'PayPal',                 
                venta.transaccion,        
                usuarioid_cliente,        
                'Confirmado'              
            ]);
        }
        
        console.log(`✅ Movimientos de caja creados automáticamente para venta ${ventaid}:`);
        console.log(`   💰 Venta productos: $${total_venta.toFixed(2)}`);
        if (costo_envio > 0) {
            console.log(`   📦 Costo envío: $${costo_envio.toFixed(2)}`);
        }
        console.log(`   💳 Comisión PayPal: -$${comision_paypal.toFixed(2)}`);
        
        await client.query('COMMIT');
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error al crear movimientos de flujo de caja para venta:', err);
        throw err;
    } finally {
        client.release();
    }
};

// Crear asiento contable para venta
const crearAsientoContableVenta = async (ventaid) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Obtener información de la venta
        const ventaResult = await client.query(`
            SELECT 
                v.ventaid, 
                v.nventa, 
                v.subtotal, 
                v.envioprecio,
                v.fecha,
                v.transaccion,
                u.nombres, 
                u.apellidos
            FROM venta v
            JOIN usuario u ON v.usuarioid = u.usuarioid
            WHERE v.ventaid = $1
        `, [ventaid]);
        
        if (ventaResult.rows.length === 0) {
            throw new Error('Venta no encontrada');
        }
        
        const venta = ventaResult.rows[0];
        const total_venta = parseFloat(venta.subtotal);
        const costo_envio = parseFloat(venta.envioprecio || 0);
        const total_general = total_venta + costo_envio;
        const comision_paypal = total_general * 0.035;
        
        // Generar número de asiento
        const numero_asiento = `AS-VENTA-${venta.nventa}`;
        
        // Obtener el usuario administrador
        const adminResult = await client.query(`
            SELECT u.usuarioid 
            FROM usuario u 
            JOIN rol_usuario ru ON u.usuarioid = ru.usuarioid 
            WHERE ru.rolid = 2
            LIMIT 1
        `);
        
        const usuarioAdmin = adminResult.rows.length > 0 ? adminResult.rows[0].usuarioid : null;

        // Crear el asiento contable
        const asientoResult = await client.query(`
            INSERT INTO asiento_contable (
                numero_asiento, fecha_asiento, descripcion,
                tipo_asiento, referencia_documento, tipo_documento,
                total_debe, total_haber, usuarioid, estado
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING asientoid
        `, [
            numero_asiento,
            venta.fecha.toISOString().split('T')[0],
            `Venta ${venta.nventa} - ${venta.nombres} ${venta.apellidos}`,
            'Automatico',
            venta.transaccion,  
            'Venta',
            total_general,      
            total_general,      
            usuarioAdmin,       // ✅ USAR TU USUARIO ADMIN
            'Aprobado'          
        ]);
        
        const asientoid = asientoResult.rows[0].asientoid;
        
        // Obtener IDs de cuentas necesarias
        const cuentasResult = await client.query(`
            SELECT cuentaid, codigo, nombre FROM plan_cuentas 
            WHERE codigo IN ('1102', '4101', '4103', '5105')
        `);
        
        const cuentas = {};
        cuentasResult.rows.forEach(cuenta => {
            cuentas[cuenta.codigo] = cuenta;
        });
        
        // DETALLE 1: DEBE - Bancos (ingreso neto)
        const ingreso_neto = total_general - comision_paypal;
        if (cuentas['1102']) {
            await client.query(`
                INSERT INTO detalle_asiento (
                    asientoid, cuentaid, debe, haber, descripcion, referencia
                ) VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                asientoid,
                cuentas['1102'].cuentaid, // Bancos
                ingreso_neto,
                0,
                `Ingreso neto venta ${venta.nventa} (después comisión PayPal)`,
                venta.transaccion
            ]);
        }
        
        // DETALLE 2: DEBE - Gastos comisión PayPal
        if (comision_paypal > 0 && cuentas['5105']) {
            await client.query(`
                INSERT INTO detalle_asiento (
                    asientoid, cuentaid, debe, haber, descripcion, referencia
                ) VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                asientoid,
                cuentas['5105'].cuentaid, // Comisiones PayPal
                comision_paypal,
                0,
                `Comisión PayPal 3.5% - Venta ${venta.nventa}`,
                venta.transaccion
            ]);
        }
        
        // DETALLE 3: HABER - Ventas productos
        if (total_venta > 0 && cuentas['4101']) {
            await client.query(`
                INSERT INTO detalle_asiento (
                    asientoid, cuentaid, debe, haber, descripcion, referencia
                ) VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                asientoid,
                cuentas['4101'].cuentaid, // Ventas
                0,
                total_venta,
                `Venta productos ${venta.nventa}`,
                venta.nventa
            ]);
        }
        
        // DETALLE 4: HABER - Ingresos por envío (si existe)
        if (costo_envio > 0 && cuentas['4103']) {
            await client.query(`
                INSERT INTO detalle_asiento (
                    asientoid, cuentaid, debe, haber, descripcion, referencia
                ) VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                asientoid,
                cuentas['4103'].cuentaid, // Ingresos por Envío
                0,
                costo_envio,
                `Ingreso por envío ${venta.nventa}`,
                venta.nventa
            ]);
        }
        
        await client.query('COMMIT');
        
        console.log(`✅ Asiento contable creado: ${numero_asiento} para venta ${ventaid}`);
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error al crear asiento contable de venta:', err);
        throw err;
    } finally {
        client.release();
    }
};

// Función para compras (deshabilitada)
const crearAsientoCompra = async (ordencompraid) => {
    console.log('Creación automática de asiento de compra deshabilitada - usar flujo de caja manual');
    return;
};



const listarOrdenesPendientesPago = async (req, res) => {
    try {
        const { proveedorid } = req.query;
        
        let query = `
            SELECT 
                oc.ordencompraid,
                oc.numero_orden,
                oc.fecha_orden,
                pr.nombre as proveedor,
                pr.email,
                oc.total as total_orden,
                COALESCE(
                    (SELECT SUM(fc.monto) 
                     FROM flujo_caja fc 
                     WHERE fc.referencia_documento = oc.numero_orden 
                     AND fc.tipo = 'Egreso' 
                     AND fc.categoria = 'Compras'
                     AND fc.estado = 'Confirmado'), 
                    0
                ) as pagado,
                oc.total - COALESCE(
                    (SELECT SUM(fc.monto) 
                     FROM flujo_caja fc 
                     WHERE fc.referencia_documento = oc.numero_orden 
                     AND fc.tipo = 'Egreso' 
                     AND fc.categoria = 'Compras'
                     AND fc.estado = 'Confirmado'), 
                    0
                ) as saldo_pendiente
            FROM orden_compra oc
            JOIN proveedor pr ON oc.proveedorid = pr.proveedorid
            WHERE oc.estado NOT IN ('Cancelada', 'Devuelta')
            AND oc.total > COALESCE(
                (SELECT SUM(fc.monto) 
                 FROM flujo_caja fc 
                 WHERE fc.referencia_documento = oc.numero_orden 
                 AND fc.tipo = 'Egreso' 
                 AND fc.categoria = 'Compras'
                 AND fc.estado = 'Confirmado'), 
                0
            )
        `;
        
        const params = [];
        
        if (proveedorid) {
            query += ` AND oc.proveedorid = $${params.length + 1}`;
            params.push(proveedorid);
        }
        
        query += ` ORDER BY oc.fecha_orden DESC`;
        
        const result = await pool.query(query, params);
        
        res.status(200).json(result.rows);
        
    } catch (err) {
        console.error('Error al listar órdenes pendientes:', err);
        res.status(500).json({ error: 'Error en el servidor' });
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
    crearMovimientosFlujoCajaVenta,
    crearAsientoContableVenta,
    crearAsientoCompra,

    listarOrdenesPendientesPago
};