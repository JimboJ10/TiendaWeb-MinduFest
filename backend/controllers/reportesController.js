const pool = require('../db/pool');

// ======================== REPORTES DE VENTAS ========================

// Reporte de ventas por período
// En reportesController.js
const reporteVentasPeriodo = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin, tipo_reporte = 'detallado' } = req.query;
        
        let baseQuery = `
            SELECT 
                v.ventaid,
                v.nventa,
                v.fecha,
                v.subtotal,
                v.envioprecio,
                (v.subtotal + COALESCE(v.envioprecio, 0)) as total,
                u.nombres || ' ' || u.apellidos as cliente,
                u.email,
                ev.nombre as estado,
                COUNT(dv.productoid) as total_productos,
                SUM(dv.cantidad) as total_items
            FROM venta v
            JOIN usuario u ON v.usuarioid = u.usuarioid
            LEFT JOIN estado_venta ev ON v.estadoid = ev.estadoid
            LEFT JOIN detalleventa dv ON v.ventaid = dv.ventaid
        `;
        
        const params = [];
        let whereClause = ' WHERE 1=1';
        
        if (fecha_inicio) {
            whereClause += ` AND v.fecha >= $${params.length + 1}`;
            params.push(fecha_inicio + ' 00:00:00');
        }
        
        if (fecha_fin) {
            whereClause += ` AND v.fecha <= $${params.length + 1}`;
            params.push(fecha_fin + ' 23:59:59');
        }
        
        baseQuery += whereClause;
        baseQuery += ` GROUP BY v.ventaid, v.nventa, v.fecha, v.subtotal, v.envioprecio, u.nombres, u.apellidos, u.email, ev.nombre`;
        baseQuery += ` ORDER BY v.fecha DESC`;
        
        const ventas = await pool.query(baseQuery, params);
        
        // Calcular resumen
        const resumenQuery = `
            SELECT 
                COUNT(v.ventaid) as total_ventas,
                COALESCE(SUM(v.subtotal + COALESCE(v.envioprecio, 0)), 0) as total_facturado,
                COALESCE(AVG(v.subtotal + COALESCE(v.envioprecio, 0)), 0) as promedio_venta,
                COALESCE(SUM(dv.cantidad), 0) as total_productos_vendidos
            FROM venta v
            LEFT JOIN detalleventa dv ON v.ventaid = dv.ventaid
            ${whereClause}
        `;
        
        const resumen = await pool.query(resumenQuery, params);
        
        res.status(200).json({
            ventas: ventas.rows,
            resumen: resumen.rows[0]
        });
        
    } catch (err) {
        console.error('Error en reporte de ventas por período:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Reporte de ventas por producto
const reporteVentasProductoSimple = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin, productoid } = req.query;
        
        // Consulta más directa sin subconsultas complejas
        let query = `
            SELECT 
                p.productoid,
                p.titulo,
                COALESCE(c.nombrecategoria, 'Sin categoría') as categoria,
                COALESCE(SUM(dv.cantidad), 0) as unidades_vendidas,
                COALESCE(COUNT(DISTINCT v.ventaid), 0) as numero_ventas,
                COALESCE(p.precio, 0) as precio_promedio,
                COALESCE(SUM(dv.subtotal), 0) as total_ingresos,
                COALESCE(p.stock, 0) as stock_actual
            FROM producto p
            LEFT JOIN categoria c ON p.categoriaid = c.categoriaid
            LEFT JOIN detalleventa dv ON p.productoid = dv.productoid
            LEFT JOIN venta v ON dv.ventaid = v.ventaid
        `;
        
        const params = [];
        let conditions = [];
        
        if (fecha_inicio) {
            conditions.push(`v.fecha >= $${params.length + 1}`);
            params.push(fecha_inicio + ' 00:00:00');
        }
        
        if (fecha_fin) {
            conditions.push(`v.fecha <= $${params.length + 1}`);
            params.push(fecha_fin + ' 23:59:59');
        }
        
        if (productoid) {
            conditions.push(`p.productoid = $${params.length + 1}`);
            params.push(productoid);
        }
        
        // Solo agregar WHERE si hay condiciones
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += ` GROUP BY p.productoid, p.titulo, c.nombrecategoria, p.precio, p.stock`;
        query += ` HAVING COALESCE(SUM(dv.cantidad), 0) > 0`;
        query += ` ORDER BY unidades_vendidas DESC, total_ingresos DESC`;
        
        console.log('Query simplificada:', query);
        console.log('Params:', params);
        
        const result = await pool.query(query, params);
        
        // Calcular resumen desde los resultados obtenidos
        const productos = result.rows;
        const resumen = {
            total_productos_vendidos: productos.length,
            total_unidades_vendidas: productos.reduce((sum, p) => sum + parseInt(p.unidades_vendidas || 0), 0),
            total_ingresos: productos.reduce((sum, p) => sum + parseFloat(p.total_ingresos || 0), 0),
            producto_mas_vendido: productos.length > 0 ? productos[0].titulo : 'N/A'
        };
        
        res.status(200).json({
            productos: productos,
            resumen: resumen
        });
        
    } catch (err) {
        console.error('Error en reporte simplificado:', err);
        res.status(500).json({ error: 'Error en el servidor', details: err.message });
    }
};

// Reporte de ventas por cliente
const reporteVentasCliente = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin, limite = 50, pais, min_compras } = req.query;
        
        let query = `
            SELECT 
                u.usuarioid,
                u.nombres || ' ' || u.apellidos as cliente,
                u.email,
                COALESCE(u.pais, 'No especificado') as pais,
                COALESCE(u.telefono, '') as telefono,
                COALESCE(u.dni, '') as dni,
                COUNT(v.ventaid) as total_compras,
                COALESCE(SUM(v.subtotal + COALESCE(v.envioprecio, 0)), 0) as total_gastado,
                COALESCE(AVG(v.subtotal + COALESCE(v.envioprecio, 0)), 0) as promedio_compra,
                MAX(v.fecha) as ultima_compra,
                MIN(v.fecha) as primera_compra,
                COALESCE(SUM(dv.cantidad), 0) as total_productos_comprados,
                COALESCE(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - MAX(v.fecha))) / 3600, 0) as horas_sin_comprar
            FROM usuario u
            INNER JOIN venta v ON u.usuarioid = v.usuarioid
            LEFT JOIN detalleventa dv ON v.ventaid = dv.ventaid
        `;
        
        const params = [];
        let conditions = [];
        
        if (fecha_inicio) {
            conditions.push(`v.fecha >= $${params.length + 1}`);
            params.push(fecha_inicio + ' 00:00:00');
        }
        
        if (fecha_fin) {
            conditions.push(`v.fecha <= $${params.length + 1}`);
            params.push(fecha_fin + ' 23:59:59');
        }
        
        if (pais) {
            conditions.push(`u.pais = $${params.length + 1}`);
            params.push(pais);
        }
        
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += ` GROUP BY u.usuarioid, u.nombres, u.apellidos, u.email, u.pais, u.telefono, u.dni`;
        
        if (min_compras) {
            query += ` HAVING COUNT(v.ventaid) >= $${params.length + 1}`;
            params.push(min_compras);
        }
        
        query += ` ORDER BY total_gastado DESC LIMIT $${params.length + 1}`;
        params.push(limite);
        
        console.log('Query clientes completa:', query);
        console.log('Params:', params);
        
        const result = await pool.query(query, params);
        
        // Procesar los resultados para convertir horas a días cuando sea necesario
        const clientesProcesados = result.rows.map(cliente => {
            const horasSinComprar = parseFloat(cliente.horas_sin_comprar || 0);
            return {
                ...cliente,
                horas_sin_comprar: horasSinComprar,
                dias_sin_comprar: Math.floor(horasSinComprar / 24)
            };
        });
        
        // Resumen calculado desde los resultados
        const resumen = {
            total_clientes: clientesProcesados.length,
            total_clientes_activos: clientesProcesados.length,
            total_facturado: clientesProcesados.reduce((sum, c) => sum + parseFloat(c.total_gastado || 0), 0),
            promedio_facturado_por_cliente: clientesProcesados.length > 0 ? 
                clientesProcesados.reduce((sum, c) => sum + parseFloat(c.total_gastado || 0), 0) / clientesProcesados.length : 0,
            cliente_top: clientesProcesados.length > 0 ? clientesProcesados[0].cliente : 'N/A'
        };
        
        res.status(200).json({
            clientes: clientesProcesados,
            resumen: resumen
        });
        
    } catch (err) {
        console.error('Error en reporte de clientes:', err);
        res.status(500).json({ error: 'Error en el servidor', details: err.message });
    }
};

// ======================== REPORTES DE INVENTARIO ========================

// Reporte de stock actual
const reporteStockActual = async (req, res) => {
    try {
        const { categoria, estado_stock = 'todos', limite = 100 } = req.query;
        
        let query = `
            SELECT 
                p.productoid,
                p.titulo,
                COALESCE(c.nombrecategoria, 'Sin categoría') as categoria,
                COALESCE(p.stock, 0) as stock,
                COALESCE(p.precio, 0) as precio,
                (COALESCE(p.stock, 0) * COALESCE(p.precio, 0)) as valor_inventario,
                CASE 
                    WHEN COALESCE(p.stock, 0) = 0 THEN 'Sin Stock'
                    WHEN COALESCE(p.stock, 0) <= 5 THEN 'Stock Bajo'
                    WHEN COALESCE(p.stock, 0) <= 20 THEN 'Stock Medio'
                    ELSE 'Stock Alto'
                END as estado_stock,
                COALESCE(p.nventas, 0) as nventas,
                COALESCE(i.total_proveedores, 0) as total_proveedores,
                COALESCE(i.cantidad_inventario, 0) as cantidad_inventario
            FROM producto p
            LEFT JOIN categoria c ON p.categoriaid = c.categoriaid
            LEFT JOIN (
                SELECT 
                    productoid, 
                    COUNT(DISTINCT proveedorid) as total_proveedores,
                    SUM(COALESCE(cantidad, 0)) as cantidad_inventario
                FROM inventario 
                WHERE proveedorid IS NOT NULL
                GROUP BY productoid
            ) i ON p.productoid = i.productoid
            WHERE 1=1
        `;
        
        const params = [];
        
        if (categoria) {
            query += ` AND c.categoriaid = $${params.length + 1}`;
            params.push(categoria);
        }
        
        if (estado_stock !== 'todos') {
            switch (estado_stock) {
                case 'sin_stock':
                    query += ` AND p.stock = 0`;
                    break;
                case 'stock_bajo':
                    query += ` AND p.stock > 0 AND p.stock <= 5`;
                    break;
                case 'stock_medio':
                    query += ` AND p.stock > 5 AND p.stock <= 20`;
                    break;
                case 'stock_alto':
                    query += ` AND p.stock > 20`;
                    break;
            }
        }
        
        query += ` ORDER BY p.stock ASC, p.titulo`;
        query += ` LIMIT $${params.length + 1}`;
        params.push(limite);
        
        const productos = await pool.query(query, params);
        
        // Resumen del inventario
        const resumenQuery = `
            SELECT 
                COUNT(*)::integer as total_productos,
                SUM(COALESCE(p.stock, 0))::integer as total_unidades,
                SUM(COALESCE(p.stock, 0) * COALESCE(p.precio, 0))::numeric as valor_total_inventario,
                SUM(CASE WHEN COALESCE(p.stock, 0) = 0 THEN 1 ELSE 0 END)::integer as productos_sin_stock,
                SUM(CASE WHEN COALESCE(p.stock, 0) <= 5 AND COALESCE(p.stock, 0) > 0 THEN 1 ELSE 0 END)::integer as productos_stock_bajo
            FROM producto p
            LEFT JOIN categoria c ON p.categoriaid = c.categoriaid
            ${categoria ? 'WHERE c.categoriaid = $1' : ''}
        `;
        
        const resumenParams = categoria ? [categoria] : [];
        const resumen = await pool.query(resumenQuery, resumenParams);
        
        res.status(200).json({
            productos: productos.rows,
            resumen: resumen.rows[0]
        });
        
    } catch (err) {
        console.error('Error en reporte de stock actual:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Reporte de movimientos de inventario
const reporteMovimientosInventario = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin, tipo_movimiento, productoid, limite = 100 } = req.query;
        
        // Movimientos por ventas (salidas)
        let ventasQuery = `
            SELECT 
                v.fecha,
                'Venta' as tipo_movimiento,
                p.titulo as producto,
                dv.cantidad,
                'Salida' as direccion,
                u.nombres || ' ' || u.apellidos as cliente,
                NULL as proveedor,
                v.nventa as referencia,
                p.productoid,
                (dv.subtotal / dv.cantidad) as precio_unitario,
                dv.subtotal as valor_total
            FROM venta v
            JOIN detalleventa dv ON v.ventaid = dv.ventaid
            JOIN producto p ON dv.productoid = p.productoid
            JOIN usuario u ON v.usuarioid = u.usuarioid
            WHERE 1=1
        `;
        
        // Movimientos por órdenes de compra (entradas)
        let comprasQuery = `
            SELECT 
                COALESCE(doc.fecha_recepcion, oc.fecha_entrega_real, oc.fecha_orden) as fecha,
                'Compra' as tipo_movimiento,
                p.titulo as producto,
                doc.recibido as cantidad,
                'Entrada' as direccion,
                NULL as cliente,
                pr.nombre as proveedor,
                oc.numero_orden as referencia,
                p.productoid,
                doc.precio_unitario,
                (doc.recibido * doc.precio_unitario) as valor_total
            FROM orden_compra oc
            JOIN detalle_orden_compra doc ON oc.ordencompraid = doc.ordencompraid
            JOIN producto p ON doc.productoid = p.productoid
            JOIN proveedor pr ON oc.proveedorid = pr.proveedorid
            WHERE doc.recibido > 0
        `;
        
        const params = [];
        let whereClauseVentas = '';
        let whereClauseCompras = '';
        
        if (fecha_inicio) {
            whereClauseVentas += ` AND v.fecha >= $${params.length + 1}`;
            whereClauseCompras += ` AND COALESCE(doc.fecha_recepcion, oc.fecha_entrega_real, oc.fecha_orden) >= $${params.length + 1}`;
            params.push(fecha_inicio + ' 00:00:00');
        }
        
        if (fecha_fin) {
            whereClauseVentas += ` AND v.fecha <= $${params.length + 1}`;
            whereClauseCompras += ` AND COALESCE(doc.fecha_recepcion, oc.fecha_entrega_real, oc.fecha_orden) <= $${params.length + 1}`;
            params.push(fecha_fin + ' 23:59:59');
        }
        
        if (productoid) {
            whereClauseVentas += ` AND p.productoid = $${params.length + 1}`;
            whereClauseCompras += ` AND p.productoid = $${params.length + 1}`;
            params.push(productoid);
        }
        
        ventasQuery += whereClauseVentas;
        comprasQuery += whereClauseCompras;
        
        let unionQuery = '';
        let hayMovimientos = true;
        
        if (!tipo_movimiento || tipo_movimiento === 'todos') {
            unionQuery = `(${ventasQuery}) UNION ALL (${comprasQuery})`;
        } else if (tipo_movimiento === 'venta') {
            unionQuery = `(${ventasQuery})`;
        } else if (tipo_movimiento === 'compra') {
            unionQuery = `(${comprasQuery})`;
        } else if (tipo_movimiento === 'ajuste' || tipo_movimiento === 'devolucion') {
            // No hay datos para ajustes y devoluciones aún
            hayMovimientos = false;
        }
        
        if (!hayMovimientos) {
            // Retornar respuesta vacía para ajustes y devoluciones
            return res.status(200).json({
                movimientos: [],
                resumen: {
                    total_movimientos: 0,
                    total_entradas: 0,
                    total_salidas: 0,
                    productos_afectados: 0,
                    valor_total_movimientos: 0
                },
                mensaje: `No hay movimientos de tipo "${tipo_movimiento}" registrados en el sistema.`
            });
        }
        
        unionQuery += ` ORDER BY fecha DESC LIMIT $${params.length + 1}`;
        params.push(limite);
        
        console.log('Query movimientos:', unionQuery);
        console.log('Params:', params);
        
        const result = await pool.query(unionQuery, params);
        
        // Calcular resumen
        const movimientos = result.rows;
        const resumen = {
            total_movimientos: movimientos.length,
            total_entradas: movimientos.filter(m => m.direccion === 'Entrada').length,
            total_salidas: movimientos.filter(m => m.direccion === 'Salida').length,
            productos_afectados: [...new Set(movimientos.map(m => m.productoid))].length,
            valor_total_movimientos: movimientos.reduce((sum, m) => sum + parseFloat(m.valor_total || 0), 0)
        };
        
        res.status(200).json({
            movimientos: movimientos,
            resumen: resumen
        });
        
    } catch (err) {
        console.error('Error en reporte de movimientos de inventario:', err);
        res.status(500).json({ error: 'Error en el servidor', details: err.message });
    }
};

// ======================== REPORTES FINANCIEROS ========================

// Reporte de cuentas por cobrar
const reporteEstadoPagos = async (req, res) => {
    try {
        const { fecha_corte } = req.query;
        const fechaCorte = fecha_corte || new Date().toISOString().split('T')[0];
        
        const query = `
            SELECT 
                v.ventaid,
                v.nventa,
                v.fecha,
                u.nombres || ' ' || u.apellidos as cliente,
                u.email,
                u.telefono,
                u.pais,
                (v.subtotal + COALESCE(v.envioprecio, 0)) as total_venta,
                CASE 
                    WHEN v.transaccion IS NOT NULL AND v.transaccion != '' 
                    THEN (v.subtotal + COALESCE(v.envioprecio, 0))
                    ELSE 0
                END as pagado,
                CASE 
                    WHEN v.transaccion IS NULL OR v.transaccion = '' 
                    THEN (v.subtotal + COALESCE(v.envioprecio, 0))
                    ELSE 0
                END as saldo_pendiente,
                EXTRACT(DAYS FROM CURRENT_DATE - v.fecha) as dias_transcurridos,
                CASE 
                    WHEN v.estadoid = 4 THEN 'Completado'
                    WHEN v.estadoid = 5 THEN 'Cancelado'
                    WHEN v.estadoid = 3 THEN 'En Envío'
                    WHEN v.estadoid = 2 THEN 'En Preparación'
                    ELSE 'Procesando'
                END as rango_estado,
                ev.nombre as estado_venta,
                CASE 
                    WHEN v.transaccion IS NOT NULL AND v.transaccion != '' 
                    THEN 'PayPal (' || v.transaccion || ')'
                    ELSE 'Pago Fallido'
                END as metodo_pago,
                CASE 
                    WHEN v.transaccion IS NOT NULL AND v.transaccion != '' 
                    THEN 'Pagado'
                    ELSE 'Error de Pago'
                END as estado_pago
            FROM venta v
            JOIN usuario u ON v.usuarioid = u.usuarioid
            JOIN estado_venta ev ON v.estadoid = ev.estadoid
            WHERE v.fecha <= $1
            AND (v.subtotal + COALESCE(v.envioprecio, 0)) > 0
            ORDER BY v.fecha DESC
        `;
        
        const result = await pool.query(query, [fechaCorte]);
        
        // Resumen actualizado para estado de pagos
        const resumenQuery = `
            SELECT 
                COUNT(*) as total_transacciones,
                COUNT(CASE WHEN v.transaccion IS NOT NULL AND v.transaccion != '' THEN 1 END) as pagos_exitosos,
                COUNT(CASE WHEN v.transaccion IS NULL OR v.transaccion = '' THEN 1 END) as pagos_fallidos,
                COUNT(CASE WHEN v.estadoid = 4 THEN 1 END) as entregas_completadas,
                COUNT(CASE WHEN v.estadoid = 5 THEN 1 END) as ventas_canceladas,
                COUNT(CASE WHEN v.estadoid IN (1,2,3) THEN 1 END) as en_proceso,
                SUM(CASE WHEN v.transaccion IS NOT NULL AND v.transaccion != '' 
                    THEN (v.subtotal + COALESCE(v.envioprecio, 0)) ELSE 0 END) as total_cobrado,
                SUM(CASE WHEN v.transaccion IS NULL OR v.transaccion = '' 
                    THEN (v.subtotal + COALESCE(v.envioprecio, 0)) ELSE 0 END) as total_perdido,
                COUNT(DISTINCT v.usuarioid) as clientes_afectados
            FROM venta v
            JOIN estado_venta ev ON v.estadoid = ev.estadoid
            WHERE v.fecha <= $1
        `;
        
        const resumen = await pool.query(resumenQuery, [fechaCorte]);
        
        res.status(200).json({
            transacciones: result.rows,
            resumen: resumen.rows[0],
            tipo_reporte: 'estado_pagos',
            mensaje: result.rows.length === 0 ? 
                'No hay transacciones en el período seleccionado.' : 
                `Se encontraron ${result.rows.length} transacciones.`
        });
        
    } catch (err) {
        console.error('Error en reporte de estado de pagos:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Reporte de cuentas por pagar
const reporteCuentasPorPagar = async (req, res) => {
    try {
        const { fecha_corte } = req.query;
        const fechaCorte = fecha_corte || new Date().toISOString().split('T')[0];
        
        const query = `
            SELECT 
                oc.ordencompraid,
                oc.numero_orden,
                oc.fecha_orden,
                pr.nombre as proveedor,
                pr.email,
                pr.telefono,
                oc.total as total_orden,
                
                -- Calcular pagado desde flujo_caja
                COALESCE(
                    (SELECT SUM(fc.monto) 
                     FROM flujo_caja fc 
                     WHERE fc.referencia_documento = oc.numero_orden 
                     AND fc.tipo = 'Egreso' 
                     AND fc.categoria = 'Compras'
                     AND fc.estado = 'Confirmado'), 
                    0
                ) as pagado,
                
                -- Saldo pendiente = total - pagado
                oc.total - COALESCE(
                    (SELECT SUM(fc.monto) 
                     FROM flujo_caja fc 
                     WHERE fc.referencia_documento = oc.numero_orden 
                     AND fc.tipo = 'Egreso' 
                     AND fc.categoria = 'Compras'
                     AND fc.estado = 'Confirmado'), 
                    0
                ) as saldo_pendiente,
                
                oc.fecha_entrega_esperada,
                EXTRACT(DAYS FROM CURRENT_DATE - oc.fecha_orden) as dias_desde_orden,
                CASE 
                    WHEN EXTRACT(DAYS FROM CURRENT_DATE - oc.fecha_orden) <= 30 THEN '0-30 días'
                    WHEN EXTRACT(DAYS FROM CURRENT_DATE - oc.fecha_orden) <= 60 THEN '31-60 días'
                    WHEN EXTRACT(DAYS FROM CURRENT_DATE - oc.fecha_orden) <= 90 THEN '61-90 días'
                    ELSE 'Más de 90 días'
                END as rango_antiguedad,
                oc.estado
            FROM orden_compra oc
            JOIN proveedor pr ON oc.proveedorid = pr.proveedorid
            WHERE oc.fecha_orden <= $1
            AND oc.estado NOT IN ('Cancelada', 'Devuelta')
            -- Solo mostrar órdenes con saldo pendiente
            AND oc.total > COALESCE(
                (SELECT SUM(fc.monto) 
                 FROM flujo_caja fc 
                 WHERE fc.referencia_documento = oc.numero_orden 
                 AND fc.tipo = 'Egreso' 
                 AND fc.categoria = 'Compras'
                 AND fc.estado = 'Confirmado'), 
                0
            )
            ORDER BY oc.fecha_orden DESC
        `;
        
        const result = await pool.query(query, [fechaCorte]);
        
        // Resumen actualizado
        const resumenQuery = `
            WITH pagos_por_orden AS (
                SELECT 
                    oc.ordencompraid,
                    oc.total,
                    oc.fecha_orden,
                    COALESCE(
                        (SELECT SUM(fc.monto) 
                         FROM flujo_caja fc 
                         WHERE fc.referencia_documento = oc.numero_orden 
                         AND fc.tipo = 'Egreso' 
                         AND fc.categoria = 'Compras'
                         AND fc.estado = 'Confirmado'), 
                        0
                    ) as pagado
                FROM orden_compra oc
                WHERE oc.fecha_orden <= $1
                AND oc.estado NOT IN ('Cancelada', 'Devuelta')
            )
            SELECT 
                COUNT(*)::integer as total_ordenes,
                COALESCE(SUM(total - pagado), 0)::numeric as total_por_pagar,
                COALESCE(SUM(CASE WHEN EXTRACT(DAYS FROM CURRENT_DATE - fecha_orden) <= 30 
                    AND total > pagado THEN total - pagado ELSE 0 END), 0)::numeric as antiguedad_0_30,
                COALESCE(SUM(CASE WHEN EXTRACT(DAYS FROM CURRENT_DATE - fecha_orden) BETWEEN 31 AND 60 
                    AND total > pagado THEN total - pagado ELSE 0 END), 0)::numeric as antiguedad_31_60,
                COALESCE(SUM(CASE WHEN EXTRACT(DAYS FROM CURRENT_DATE - fecha_orden) BETWEEN 61 AND 90 
                    AND total > pagado THEN total - pagado ELSE 0 END), 0)::numeric as antiguedad_61_90,
                COALESCE(SUM(CASE WHEN EXTRACT(DAYS FROM CURRENT_DATE - fecha_orden) > 90 
                    AND total > pagado THEN total - pagado ELSE 0 END), 0)::numeric as antiguedad_mas_90
            FROM pagos_por_orden
            WHERE total > pagado
        `;
        
        const resumen = await pool.query(resumenQuery, [fechaCorte]);
        
        res.status(200).json({
            ordenes: result.rows,
            resumen: resumen.rows[0],
            mensaje: result.rows.length === 0 ? 
                'No hay órdenes pendientes de pago en el período seleccionado.' : 
                `Se encontraron ${result.rows.length} órdenes pendientes de pago.`
        });
        
    } catch (err) {
        console.error('Error en reporte de cuentas por pagar:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// ======================== REPORTES ADMINISTRATIVOS ========================

// Reporte de actividad de usuarios
const reporteActividadUsuarios = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;
        
        // Actividad de ventas por usuario administrativo
        let query = `
            SELECT 
                u.usuarioid,
                u.nombres || ' ' || u.apellidos as usuario,
                u.email,
                r.nombre as rol,
                COUNT(DISTINCT v.ventaid) as ventas_procesadas,
                COUNT(DISTINCT oc.ordencompraid) as ordenes_creadas,
                MAX(GREATEST(v.fecha, oc.fecha_orden)) as ultima_actividad
            FROM usuario u
            JOIN rol_usuario ru ON u.usuarioid = ru.usuarioid
            JOIN rol r ON ru.rolid = r.rolid
            LEFT JOIN venta v ON u.usuarioid = v.usuarioid
            LEFT JOIN orden_compra oc ON u.usuarioid = oc.usuarioid
            WHERE r.nombre IN ('Administrador', 'Vendedor')
        `;
        
        const params = [];
        
        if (fecha_inicio) {
            query += ` AND (v.fecha >= $${params.length + 1} OR oc.fecha_orden >= $${params.length + 1})`;
            params.push(fecha_inicio);
        }
        
        if (fecha_fin) {
            query += ` AND (v.fecha <= $${params.length + 1} OR oc.fecha_orden <= $${params.length + 1})`;
            params.push(fecha_fin);
        }
        
        query += ` GROUP BY u.usuarioid, u.nombres, u.apellidos, u.email, r.nombre`;
        query += ` ORDER BY ultima_actividad DESC NULLS LAST`;
        
        const result = await pool.query(query, params);
        
        res.status(200).json(result.rows);
        
    } catch (err) {
        console.error('Error en reporte de actividad de usuarios:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Dashboard de reportes (resumen general)
const dashboardReportes = async (req, res) => {
    try {
        const { periodo = '30' } = req.query; // días
        const fechaInicio = new Date();
        fechaInicio.setDate(fechaInicio.getDate() - parseInt(periodo));
        const fechaInicioStr = fechaInicio.toISOString().split('T')[0] + ' 00:00:00';
        
        // Resumen de ventas
        const ventasQuery = `
            SELECT 
                COUNT(*) as total_ventas,
                COALESCE(SUM(subtotal + COALESCE(envioprecio, 0)), 0) as total_facturado,
                COALESCE(AVG(subtotal + COALESCE(envioprecio, 0)), 0) as promedio_venta
            FROM venta 
            WHERE fecha >= $1
        `;
        
        // Resumen de productos
        const productosQuery = `
            SELECT 
                COUNT(*) as total_productos,
                SUM(COALESCE(stock, 0)) as total_stock,
                SUM(CASE WHEN COALESCE(stock, 0) <= 5 THEN 1 ELSE 0 END) as productos_stock_bajo,
                SUM(COALESCE(stock, 0) * COALESCE(precio, 0)) as valor_inventario
            FROM producto
        `;
        
        // Resumen de clientes
        const clientesQuery = `
            SELECT 
                COUNT(DISTINCT u.usuarioid) as total_clientes,
                COUNT(DISTINCT v.usuarioid) as clientes_activos
            FROM usuario u
            LEFT JOIN rol_usuario ru ON u.usuarioid = ru.usuarioid
            LEFT JOIN rol r ON ru.rolid = r.rolid
            LEFT JOIN venta v ON u.usuarioid = v.usuarioid AND v.fecha >= $1
            WHERE (r.nombre = 'Cliente' OR r.nombre IS NULL)
        `;
        
        // Resumen de órdenes de compra
        const ordenesQuery = `
            SELECT 
                COUNT(*) as total_ordenes,
                COALESCE(SUM(total), 0) as total_ordenes_valor,
                SUM(CASE WHEN estado = 'Pendiente' THEN 1 ELSE 0 END) as ordenes_pendientes
            FROM orden_compra 
            WHERE fecha_orden >= $1
        `;
        
        const [ventas, productos, clientes, ordenes] = await Promise.all([
            pool.query(ventasQuery, [fechaInicioStr]),
            pool.query(productosQuery),
            pool.query(clientesQuery, [fechaInicioStr]),
            pool.query(ordenesQuery, [fechaInicioStr])
        ]);
        
        res.status(200).json({
            periodo_dias: parseInt(periodo),
            ventas: ventas.rows[0],
            productos: productos.rows[0],
            clientes: clientes.rows[0],
            ordenes: ordenes.rows[0]
        });
        
    } catch (err) {
        console.error('Error en dashboard de reportes:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Método adicional para obtener categorías para los filtros
const obtenerCategorias = async (req, res) => {
    try {
        const query = `
            SELECT 
                c.categoriaid,
                c.nombrecategoria,
                COUNT(p.productoid) as total_productos
            FROM categoria c
            LEFT JOIN producto p ON c.categoriaid = p.categoriaid
            GROUP BY c.categoriaid, c.nombrecategoria
            ORDER BY c.nombrecategoria
        `;
        
        console.log('Query obtener categorías:', query);
        
        const result = await pool.query(query);
        
        console.log('Categorías encontradas:', result.rows);
        
        res.status(200).json(result.rows);
        
    } catch (err) {
        console.error('Error al obtener categorías:', err);
        res.status(500).json({ error: 'Error en el servidor', details: err.message });
    }
};

const obtenerProductos = async (req, res) => {
    try {
        const query = `
            SELECT 
                p.productoid,
                p.titulo,
                COALESCE(c.nombrecategoria, 'Sin categoría') as categoria,
                p.stock
            FROM producto p
            LEFT JOIN categoria c ON p.categoriaid = c.categoriaid
            ORDER BY p.titulo
        `;
        
        console.log('Query obtener productos:', query);
        
        const result = await pool.query(query);
        
        console.log('Productos encontrados:', result.rows);
        
        res.status(200).json(result.rows);
        
    } catch (err) {
        console.error('Error al obtener productos:', err);
        res.status(500).json({ error: 'Error en el servidor', details: err.message });
    }
};



module.exports = {
    // Reportes de ventas
    reporteVentasPeriodo,
    reporteVentasProductoSimple,
    reporteVentasCliente,
    
    // Reportes de inventario
    reporteStockActual,
    reporteMovimientosInventario,
    
    // Reportes financieros
    reporteEstadoPagos,
    reporteCuentasPorPagar,
    
    // Reportes administrativos
    reporteActividadUsuarios,
    
    // Dashboard
    dashboardReportes,

    // Utilitarios
    obtenerCategorias,
    obtenerProductos
};