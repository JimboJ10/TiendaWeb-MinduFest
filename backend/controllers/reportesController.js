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
        const { fecha_inicio, fecha_fin, limite = 50 } = req.query;
        
        let query = `
            SELECT 
                u.usuarioid,
                u.nombres || ' ' || u.apellidos as cliente,
                u.email,
                u.pais,
                COUNT(v.ventaid) as total_compras,
                SUM(v.subtotal + COALESCE(v.envioprecio, 0)) as total_gastado,
                AVG(v.subtotal + COALESCE(v.envioprecio, 0)) as promedio_compra,
                MAX(v.fecha) as ultima_compra,
                SUM(dv.cantidad) as total_productos_comprados
            FROM usuario u
            LEFT JOIN rol_usuario ru ON u.usuarioid = ru.usuarioid
            LEFT JOIN rol r ON ru.rolid = r.rolid
            LEFT JOIN venta v ON u.usuarioid = v.usuarioid
            LEFT JOIN detalleventa dv ON v.ventaid = dv.ventaid
            WHERE (r.nombre = 'Cliente' OR r.nombre IS NULL)
        `;
        
        const params = [];
        
        if (fecha_inicio) {
            query += ` AND (v.fecha >= $${params.length + 1} OR v.fecha IS NULL)`;
            params.push(fecha_inicio + ' 00:00:00');
        }
        
        if (fecha_fin) {
            query += ` AND (v.fecha <= $${params.length + 1} OR v.fecha IS NULL)`;
            params.push(fecha_fin + ' 23:59:59');
        }
        
        query += ` GROUP BY u.usuarioid, u.nombres, u.apellidos, u.email, u.pais`;
        query += ` HAVING COUNT(v.ventaid) > 0`;
        query += ` ORDER BY total_gastado DESC NULLS LAST`;
        query += ` LIMIT $${params.length + 1}`;
        params.push(limite);
        
        const result = await pool.query(query, params);
        
        res.status(200).json(result.rows);
        
    } catch (err) {
        console.error('Error en reporte de ventas por cliente:', err);
        res.status(500).json({ error: 'Error en el servidor' });
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
                c.nombrecategoria as categoria,
                p.stock,
                p.precio,
                (p.stock * COALESCE(p.precio, 0)) as valor_inventario,
                CASE 
                    WHEN p.stock = 0 THEN 'Sin Stock'
                    WHEN p.stock <= 5 THEN 'Stock Bajo'
                    WHEN p.stock <= 20 THEN 'Stock Medio'
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
                    SUM(cantidad) as cantidad_inventario
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
                COUNT(*) as total_productos,
                SUM(COALESCE(p.stock, 0)) as total_unidades,
                SUM(COALESCE(p.stock, 0) * COALESCE(p.precio, 0)) as valor_total_inventario,
                SUM(CASE WHEN COALESCE(p.stock, 0) = 0 THEN 1 ELSE 0 END) as productos_sin_stock,
                SUM(CASE WHEN COALESCE(p.stock, 0) <= 5 AND COALESCE(p.stock, 0) > 0 THEN 1 ELSE 0 END) as productos_stock_bajo
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
        const { fecha_inicio, fecha_fin, tipo_movimiento, productoid } = req.query;
        
        // Movimientos por ventas
        let ventasQuery = `
            SELECT 
                v.fecha,
                'Venta' as tipo_movimiento,
                p.titulo as producto,
                dv.cantidad as cantidad,
                'Salida' as direccion,
                u.nombres || ' ' || u.apellidos as cliente,
                v.nventa as referencia
            FROM venta v
            JOIN detalleventa dv ON v.ventaid = dv.ventaid
            JOIN producto p ON dv.productoid = p.productoid
            JOIN usuario u ON v.usuarioid = u.usuarioid
            WHERE 1=1
        `;
        
        // Movimientos por órdenes de compra
        let comprasQuery = `
            SELECT 
                oc.fecha_entrega_real as fecha,
                'Compra' as tipo_movimiento,
                p.titulo as producto,
                doc.recibido as cantidad,
                'Entrada' as direccion,
                pr.nombre as proveedor,
                oc.numero_orden as referencia
            FROM orden_compra oc
            JOIN detalle_orden_compra doc ON oc.ordencompraid = doc.ordencompraid
            JOIN producto p ON doc.productoid = p.productoid
            JOIN proveedor pr ON oc.proveedorid = pr.proveedorid
            WHERE doc.recibido > 0 AND oc.fecha_entrega_real IS NOT NULL
        `;
        
        const params = [];
        let whereClause = '';
        
        if (fecha_inicio) {
            whereClause += ` AND fecha >= $${params.length + 1}`;
            params.push(fecha_inicio);
        }
        
        if (fecha_fin) {
            whereClause += ` AND fecha <= $${params.length + 1}`;
            params.push(fecha_fin);
        }
        
        if (productoid) {
            whereClause += ` AND p.productoid = $${params.length + 1}`;
            params.push(productoid);
        }
        
        ventasQuery += whereClause.replace('fecha', 'v.fecha');
        comprasQuery += whereClause.replace('fecha', 'oc.fecha_entrega_real');
        
        let unionQuery = `(${ventasQuery}) UNION ALL (${comprasQuery})`;
        
        if (tipo_movimiento) {
            if (tipo_movimiento === 'venta') {
                unionQuery = `(${ventasQuery})`;
            } else if (tipo_movimiento === 'compra') {
                unionQuery = `(${comprasQuery})`;
            }
        }
        
        unionQuery += ` ORDER BY fecha DESC`;
        
        const result = await pool.query(unionQuery, params);
        
        res.status(200).json(result.rows);
        
    } catch (err) {
        console.error('Error en reporte de movimientos de inventario:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// ======================== REPORTES FINANCIEROS ========================

// Reporte de cuentas por cobrar
const reporteCuentasPorCobrar = async (req, res) => {
    try {
        const { fecha_corte } = req.query;
        const fechaCorte = fecha_corte || new Date().toISOString().split('T')[0];
        
        // Por ahora simulamos con ventas que podrían tener saldo pendiente
        // En un sistema más complejo, tendrías una tabla de cuentas por cobrar
        const query = `
            SELECT 
                v.ventaid,
                v.nventa,
                v.fecha,
                u.nombres || ' ' || u.apellidos as cliente,
                u.email,
                u.telefono,
                (v.subtotal + v.envioprecio) as total_venta,
                0 as pagado, -- Simular pagos
                (v.subtotal + v.envioprecio) as saldo_pendiente,
                EXTRACT(DAYS FROM CURRENT_DATE - v.fecha) as dias_vencido,
                CASE 
                    WHEN EXTRACT(DAYS FROM CURRENT_DATE - v.fecha) <= 30 THEN '0-30 días'
                    WHEN EXTRACT(DAYS FROM CURRENT_DATE - v.fecha) <= 60 THEN '31-60 días'
                    WHEN EXTRACT(DAYS FROM CURRENT_DATE - v.fecha) <= 90 THEN '61-90 días'
                    ELSE 'Más de 90 días'
                END as rango_vencimiento
            FROM venta v
            JOIN usuario u ON v.usuarioid = u.usuarioid
            WHERE v.fecha <= $1
            AND (v.subtotal + v.envioprecio) > 0
            ORDER BY v.fecha DESC
        `;
        
        const result = await pool.query(query, [fechaCorte]);
        
        // Resumen por rangos de vencimiento
        const resumenQuery = `
            SELECT 
                COUNT(*) as total_cuentas,
                SUM(v.subtotal + v.envioprecio) as total_por_cobrar,
                SUM(CASE WHEN EXTRACT(DAYS FROM CURRENT_DATE - v.fecha) <= 30 
                    THEN (v.subtotal + v.envioprecio) ELSE 0 END) as vencido_0_30,
                SUM(CASE WHEN EXTRACT(DAYS FROM CURRENT_DATE - v.fecha) BETWEEN 31 AND 60 
                    THEN (v.subtotal + v.envioprecio) ELSE 0 END) as vencido_31_60,
                SUM(CASE WHEN EXTRACT(DAYS FROM CURRENT_DATE - v.fecha) BETWEEN 61 AND 90 
                    THEN (v.subtotal + v.envioprecio) ELSE 0 END) as vencido_61_90,
                SUM(CASE WHEN EXTRACT(DAYS FROM CURRENT_DATE - v.fecha) > 90 
                    THEN (v.subtotal + v.envioprecio) ELSE 0 END) as vencido_mas_90
            FROM venta v
            WHERE v.fecha <= $1
        `;
        
        const resumen = await pool.query(resumenQuery, [fechaCorte]);
        
        res.status(200).json({
            cuentas: result.rows,
            resumen: resumen.rows[0]
        });
        
    } catch (err) {
        console.error('Error en reporte de cuentas por cobrar:', err);
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
                0 as pagado, -- Simular pagos
                oc.total as saldo_pendiente,
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
            AND oc.estado IN ('Pendiente', 'Confirmada', 'Parcialmente Recibida', 'Recibida Completa')
            ORDER BY oc.fecha_orden DESC
        `;
        
        const result = await pool.query(query, [fechaCorte]);
        
        // Resumen
        const resumenQuery = `
            SELECT 
                COUNT(*) as total_ordenes,
                SUM(oc.total) as total_por_pagar,
                SUM(CASE WHEN EXTRACT(DAYS FROM CURRENT_DATE - oc.fecha_orden) <= 30 
                    THEN oc.total ELSE 0 END) as antiguedad_0_30,
                SUM(CASE WHEN EXTRACT(DAYS FROM CURRENT_DATE - oc.fecha_orden) BETWEEN 31 AND 60 
                    THEN oc.total ELSE 0 END) as antiguedad_31_60,
                SUM(CASE WHEN EXTRACT(DAYS FROM CURRENT_DATE - oc.fecha_orden) BETWEEN 61 AND 90 
                    THEN oc.total ELSE 0 END) as antiguedad_61_90,
                SUM(CASE WHEN EXTRACT(DAYS FROM CURRENT_DATE - oc.fecha_orden) > 90 
                    THEN oc.total ELSE 0 END) as antiguedad_mas_90
            FROM orden_compra oc
            WHERE oc.fecha_orden <= $1
            AND oc.estado IN ('Pendiente', 'Confirmada', 'Parcialmente Recibida', 'Recibida Completa')
        `;
        
        const resumen = await pool.query(resumenQuery, [fechaCorte]);
        
        res.status(200).json({
            ordenes: result.rows,
            resumen: resumen.rows[0]
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
                categoriaid,
                nombrecategoria,
                COUNT(p.productoid) as total_productos
            FROM categoria c
            LEFT JOIN producto p ON c.categoriaid = p.categoriaid
            GROUP BY c.categoriaid, c.nombrecategoria
            ORDER BY c.nombrecategoria
        `;
        
        const result = await pool.query(query);
        res.status(200).json(result.rows);
        
    } catch (err) {
        console.error('Error al obtener categorías:', err);
        res.status(500).json({ error: 'Error en el servidor' });
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
    reporteCuentasPorCobrar,
    reporteCuentasPorPagar,
    
    // Reportes administrativos
    reporteActividadUsuarios,
    
    // Dashboard
    dashboardReportes,

    // Utilitarios
    obtenerCategorias
};