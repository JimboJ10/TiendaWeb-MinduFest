const pool = require('../db/pool');
const { crearAsientoCompra } = require('./financieroController');

const listarOrdenesCompra = async (req, res) => {
    try {
        const { filtro, estado, proveedorid, desde, hasta } = req.query;
        
        let query = `
            SELECT 
                oc.*,
                p.nombre as nombre_proveedor,
                u.nombres as usuario_nombres,
                u.apellidos as usuario_apellidos,
                COUNT(doc.detalleordencompraid) as total_items
            FROM orden_compra oc
            LEFT JOIN proveedor p ON oc.proveedorid = p.proveedorid
            LEFT JOIN usuario u ON oc.usuarioid = u.usuarioid
            LEFT JOIN detalle_orden_compra doc ON oc.ordencompraid = doc.ordencompraid
            WHERE 1=1
        `;
        
        const params = [];
        
        if (filtro) {
            query += ` AND (oc.numero_orden ILIKE $${params.length + 1} OR p.nombre ILIKE $${params.length + 1})`;
            params.push(`%${filtro}%`);
        }
        
        if (estado) {
            query += ` AND oc.estado = $${params.length + 1}`;
            params.push(estado);
        }
        
        if (proveedorid) {
            query += ` AND oc.proveedorid = $${params.length + 1}`;
            params.push(proveedorid);
        }
        
        if (desde) {
            query += ` AND oc.fecha_orden >= $${params.length + 1}`;
            params.push(desde);
        }
        
        if (hasta) {
            query += ` AND oc.fecha_orden <= $${params.length + 1}`;
            params.push(hasta);
        }
        
        query += ` GROUP BY oc.ordencompraid, p.nombre, u.nombres, u.apellidos ORDER BY oc.fecha_creacion DESC`;
        
        const result = await pool.query(query, params);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error al listar órdenes de compra:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Obtener una orden de compra por ID
const obtenerOrdenCompra = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Obtener la orden de compra
        const ordenResult = await pool.query(`
            SELECT 
                oc.*,
                p.nombre as nombre_proveedor,
                p.email as email_proveedor,
                p.telefono as telefono_proveedor,
                u.nombres as usuario_nombres,
                u.apellidos as usuario_apellidos
            FROM orden_compra oc
            LEFT JOIN proveedor p ON oc.proveedorid = p.proveedorid
            LEFT JOIN usuario u ON oc.usuarioid = u.usuarioid
            WHERE oc.ordencompraid = $1
        `, [id]);
        
        if (ordenResult.rows.length === 0) {
            return res.status(404).json({ error: 'Orden de compra no encontrada' });
        }
        
        // Obtener los detalles de la orden
        const detallesResult = await pool.query(`
            SELECT 
                doc.*,
                p.titulo as producto_titulo,
                p.stock as stock_actual,
                c.nombrecategoria as categoria
            FROM detalle_orden_compra doc
            JOIN producto p ON doc.productoid = p.productoid
            JOIN categoria c ON p.categoriaid = c.categoriaid
            WHERE doc.ordencompraid = $1
            ORDER BY doc.detalleordencompraid
        `, [id]);
        
        const orden = ordenResult.rows[0];
        orden.detalles = detallesResult.rows;
        
        res.status(200).json(orden);
    } catch (err) {
        console.error('Error al obtener orden de compra:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Crear nueva orden de compra
const crearOrdenCompra = async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const {
            proveedorid,
            fecha_entrega_esperada,
            observaciones,
            metodo_pago,
            productos, // Array de productos con: productoid, cantidad, precio_unitario, descuento_porcentaje
            descuento_porcentaje = 0, // Porcentaje de descuento general (ej: 0.05 = 5%)
            impuesto_porcentaje = 0   // Porcentaje de impuesto (ej: 0.12 = 12%)
        } = req.body;
        
        const usuarioid = req.user.id;
        
        // Validar campos requeridos
        if (!proveedorid || !productos || productos.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Proveedor y productos son requeridos' });
        }
        
        // Generar número de orden único
        const numero_orden = `OC-${Date.now()}`;
        
        // Calcular totales
        let subtotal = 0;
        let productos_calculados = [];
        
        for (const producto of productos) {
            const precio_base = parseFloat(producto.precio_unitario);
            const cantidad = parseInt(producto.cantidad);
            const descuento_item_porcentaje = parseFloat(producto.descuento_porcentaje || 0);
            
            // Calcular descuento por item en dólares
            const descuento_item_dolares = precio_base * cantidad * descuento_item_porcentaje;
            const subtotal_item = (precio_base * cantidad) - descuento_item_dolares;
            
            productos_calculados.push({
                ...producto,
                descuento_item: descuento_item_dolares, // Guardar en dólares
                subtotal: subtotal_item
            });
            
            subtotal += subtotal_item;
        }
        
        // Calcular descuento general en dólares
        const descuento_dolares = subtotal * parseFloat(descuento_porcentaje);
        
        // Calcular base para impuestos (subtotal - descuento general)
        const base_impuesto = subtotal - descuento_dolares;
        
        // Calcular impuestos en dólares
        const impuestos_dolares = base_impuesto * parseFloat(impuesto_porcentaje);
        
        // Total final
        const total = base_impuesto + impuestos_dolares;
        
        // Crear la orden de compra
        const ordenResult = await client.query(`
            INSERT INTO orden_compra (
                numero_orden, proveedorid, fecha_entrega_esperada, 
                observaciones, usuarioid, metodo_pago, subtotal, 
                impuestos, descuento, total
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
            RETURNING ordencompraid
        `, [
            numero_orden, proveedorid, fecha_entrega_esperada,
            observaciones, usuarioid, metodo_pago, subtotal,
            impuestos_dolares, descuento_dolares, total
        ]);
        
        const ordencompraid = ordenResult.rows[0].ordencompraid;
        
        // Insertar detalles de la orden con descuentos calculados
        for (const producto of productos_calculados) {
            await client.query(`
                INSERT INTO detalle_orden_compra (
                    ordencompraid, productoid, cantidad, precio_unitario,
                    descuento_item, subtotal
                ) VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                ordencompraid, producto.productoid, producto.cantidad,
                producto.precio_unitario, producto.descuento_item, producto.subtotal
            ]);
        }
        
        await client.query('COMMIT');
        
        res.status(201).json({
            message: 'Orden de compra creada con éxito',
            ordencompraid,
            numero_orden,
            calculo_detalle: {
                subtotal: subtotal,
                descuento_porcentaje: descuento_porcentaje,
                descuento_dolares: descuento_dolares,
                impuesto_porcentaje: impuesto_porcentaje,
                impuestos_dolares: impuestos_dolares,
                total: total
            }
        });
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al crear orden de compra:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    } finally {
        client.release();
    }
};

// Actualizar orden de compra
const actualizarOrdenCompra = async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const { id } = req.params;
        const {
            proveedorid,
            fecha_entrega_esperada,
            observaciones,
            metodo_pago,
            productos,
            descuento_porcentaje = 0, // Cambiar a porcentaje
            impuesto_porcentaje = 0   // Cambiar a porcentaje
        } = req.body;
        
        // Verificar que la orden existe y está en estado modificable
        const ordenExiste = await client.query(`
            SELECT estado FROM orden_compra WHERE ordencompraid = $1
        `, [id]);
        
        if (ordenExiste.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Orden de compra no encontrada' });
        }
        
        const estadoActual = ordenExiste.rows[0].estado;
        if (['Recibida Completa', 'Cancelada'].includes(estadoActual)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'No se puede modificar una orden en estado ' + estadoActual });
        }
        
        // Calcular nuevos totales con la misma lógica
        let subtotal = 0;
        let productos_calculados = [];
        
        for (const producto of productos) {
            const precio_base = parseFloat(producto.precio_unitario);
            const cantidad = parseInt(producto.cantidad);
            const descuento_item_porcentaje = parseFloat(producto.descuento_porcentaje || 0);
            
            // Calcular descuento por item en dólares
            const descuento_item_dolares = precio_base * cantidad * descuento_item_porcentaje;
            const subtotal_item = (precio_base * cantidad) - descuento_item_dolares;
            
            productos_calculados.push({
                ...producto,
                descuento_item: descuento_item_dolares,
                subtotal: subtotal_item
            });
            
            subtotal += subtotal_item;
        }
        
        // Calcular descuento general en dólares
        const descuento_dolares = subtotal * parseFloat(descuento_porcentaje);
        
        // Calcular base para impuestos
        const base_impuesto = subtotal - descuento_dolares;
        
        // Calcular impuestos en dólares
        const impuestos_dolares = base_impuesto * parseFloat(impuesto_porcentaje);
        
        // Total final
        const total = base_impuesto + impuestos_dolares;
        
        // Actualizar la orden de compra
        await client.query(`
            UPDATE orden_compra SET
                proveedorid = $1,
                fecha_entrega_esperada = $2,
                observaciones = $3,
                metodo_pago = $4,
                subtotal = $5,
                impuestos = $6,
                descuento = $7,
                total = $8,
                fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE ordencompraid = $9
        `, [
            proveedorid, fecha_entrega_esperada, observaciones,
            metodo_pago, subtotal, impuestos_dolares, descuento_dolares, total, id
        ]);
        
        // Eliminar detalles existentes y crear nuevos
        await client.query('DELETE FROM detalle_orden_compra WHERE ordencompraid = $1', [id]);
        
        for (const producto of productos_calculados) {
            await client.query(`
                INSERT INTO detalle_orden_compra (
                    ordencompraid, productoid, cantidad, precio_unitario,
                    descuento_item, subtotal
                ) VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                id, producto.productoid, producto.cantidad,
                producto.precio_unitario, producto.descuento_item, producto.subtotal
            ]);
        }
        
        await client.query('COMMIT');
        
        res.status(200).json({
            message: 'Orden de compra actualizada con éxito',
            calculo_detalle: {
                subtotal: subtotal,
                descuento_porcentaje: descuento_porcentaje,
                descuento_dolares: descuento_dolares,
                impuesto_porcentaje: impuesto_porcentaje,
                impuestos_dolares: impuestos_dolares,
                total: total
            }
        });
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al actualizar orden de compra:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    } finally {
        client.release();
    }
};

// Cambiar estado de orden de compra
const cambiarEstadoOrden = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, observaciones } = req.body;
        
        // Validar que el estado sea válido
        const estadosValidos = [
            'Pendiente', 'Enviada', 'Confirmada', 'En Tránsito',
            'Parcialmente Recibida', 'Recibida Completa', 'Cancelada', 'Devuelta'
        ];
        
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ error: 'Estado no válido' });
        }
        
        await pool.query(`
            UPDATE orden_compra SET
                estado = $1,
                observaciones = COALESCE($2, observaciones),
                fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE ordencompraid = $3
        `, [estado, observaciones, id]);
        
        res.status(200).json({
            message: 'Estado actualizado con éxito'
        });
        
    } catch (err) {
        console.error('Error al cambiar estado:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Recibir productos (parcial o total)
const recibirProductos = async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const { id } = req.params;
        const { productos_recibidos } = req.body;
        
        // Validar que productos_recibidos existe y es un array
        if (!productos_recibidos || !Array.isArray(productos_recibidos) || productos_recibidos.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'No se proporcionaron productos para recibir' });
        }
        
        let todosRecibidos = true;
        
        // Obtener información de la orden para el proveedor
        const ordenResult = await client.query(`
            SELECT proveedorid FROM orden_compra WHERE ordencompraid = $1
        `, [parseInt(id)]);
        
        if (ordenResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Orden de compra no encontrada' });
        }
        
        const proveedorid = parseInt(ordenResult.rows[0].proveedorid);
        
        for (const item of productos_recibidos) {
            const { detalleordencompraid, cantidad_recibida } = item;
            
            // Validar que los datos requeridos estén presentes
            if (!detalleordencompraid || !cantidad_recibida || cantidad_recibida <= 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Datos de recepción inválidos' });
            }
            
            const detalleId = parseInt(detalleordencompraid);
            const cantidadRecibida = parseInt(cantidad_recibida);
            
            // Obtener información del detalle
            const detalleResult = await client.query(`
                SELECT doc.*, p.productoid 
                FROM detalle_orden_compra doc
                JOIN producto p ON doc.productoid = p.productoid
                WHERE doc.detalleordencompraid = $1
            `, [detalleId]);
            
            if (detalleResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Detalle de orden no encontrado' });
            }
            
            const detalle = detalleResult.rows[0];
            const productoid = parseInt(detalle.productoid);
            const cantidadOrdenada = parseInt(detalle.cantidad);
            const cantidadRecibidaAntes = parseInt(detalle.recibido || 0);
            const nueva_cantidad_recibida = cantidadRecibidaAntes + cantidadRecibida;
            
            // Validar que no se reciba más de lo ordenado
            if (nueva_cantidad_recibida > cantidadOrdenada) {
                await client.query('ROLLBACK');
                return res.status(400).json({ 
                    error: `No se puede recibir más cantidad de la ordenada para el producto ${productoid}` 
                });
            }
            
            // Actualizar cantidad recibida en detalle_orden_compra
            await client.query(`
                UPDATE detalle_orden_compra SET
                    recibido = $1,
                    fecha_recepcion = CASE 
                        WHEN recibido = 0 THEN CURRENT_TIMESTAMP 
                        ELSE fecha_recepcion 
                    END
                WHERE detalleordencompraid = $2
            `, [nueva_cantidad_recibida, detalleId]);
            
            // Actualizar stock del producto
            await client.query(`
                UPDATE producto SET stock = stock + $1 WHERE productoid = $2
            `, [cantidadRecibida, productoid]);
            
            // SIMPLIFICADO: Insertar en inventario sin campo proveedor duplicado
            await client.query(`
                INSERT INTO inventario (productoid, cantidad, proveedorid)
                VALUES ($1, $2, $3)
            `, [productoid, cantidadRecibida, proveedorid]);
            
            // Verificar si este producto está completamente recibido
            if (nueva_cantidad_recibida < cantidadOrdenada) {
                todosRecibidos = false;
            }
        }
        
        // Determinar nuevo estado de la orden
        let nuevoEstado;
        if (todosRecibidos) {
            // Verificar si TODOS los productos de la orden están completamente recibidos
            const pendientesResult = await client.query(`
                SELECT COUNT(*) FROM detalle_orden_compra 
                WHERE ordencompraid = $1 AND recibido < cantidad
            `, [parseInt(id)]);
            
            const cantidadPendientes = parseInt(pendientesResult.rows[0].count);
            nuevoEstado = cantidadPendientes === 0 ? 'Recibida Completa' : 'Parcialmente Recibida';
        } else {
            nuevoEstado = 'Parcialmente Recibida';
        }
        
        // Actualizar estado de la orden
        await client.query(`
            UPDATE orden_compra SET
                estado = $1::varchar,
                fecha_entrega_real = CASE 
                    WHEN $1::varchar = 'Recibida Completa' THEN CURRENT_TIMESTAMP 
                    ELSE fecha_entrega_real 
                END,
                fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE ordencompraid = $2
        `, [nuevoEstado, parseInt(id)]);
        
        await client.query('COMMIT');

        // CREAR ASIENTO CONTABLE AUTOMÁTICO SOLO CUANDO ESTÉ COMPLETAMENTE RECIBIDA
        if (nuevoEstado === 'Recibida Completa') {
            try {
                await crearAsientoCompra(parseInt(id));
                console.log(`Asiento contable creado para orden de compra ${id}`);
            } catch (asientoError) {
                console.error('Error al crear asiento contable para compra:', asientoError);
                // No fallar la recepción por error en contabilidad
                // Podrías enviar una notificación al administrador aquí
            }
        }
        
        res.status(200).json({
            message: 'Productos recibidos con éxito',
            nuevo_estado: nuevoEstado
        });
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al recibir productos:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    } finally {
        client.release();
    }
};

// Cancelar orden de compra
const cancelarOrdenCompra = async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body;
        
        const result = await pool.query(`
            UPDATE orden_compra SET
                estado = 'Cancelada',
                observaciones = COALESCE($1, observaciones),
                fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE ordencompraid = $2 AND estado NOT IN ('Recibida Completa', 'Cancelada')
            RETURNING *
        `, [motivo, id]);
        
        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'No se puede cancelar esta orden' });
        }
        
        res.status(200).json({
            message: 'Orden de compra cancelada con éxito'
        });
        
    } catch (err) {
        console.error('Error al cancelar orden:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Obtener estadísticas de órdenes de compra
const obtenerEstadisticasOrdenes = async (req, res) => {
    try {
        const { desde, hasta } = req.query;
        
        let filtroFecha = '';
        const params = [];
        
        if (desde && hasta) {
            filtroFecha = 'WHERE fecha_orden BETWEEN $1 AND $2';
            params.push(desde, hasta);
        }
        
        const estadisticasResult = await pool.query(`
            SELECT 
                COUNT(*) as total_ordenes,
                COUNT(CASE WHEN estado = 'Pendiente' THEN 1 END) as pendientes,
                COUNT(CASE WHEN estado = 'Enviada' THEN 1 END) as enviadas,
                COUNT(CASE WHEN estado = 'Recibida Completa' THEN 1 END) as completadas,
                COUNT(CASE WHEN estado = 'Cancelada' THEN 1 END) as canceladas,
                SUM(total) as valor_total,
                AVG(total) as valor_promedio
            FROM orden_compra ${filtroFecha}
        `, params);
        
        res.status(200).json(estadisticasResult.rows[0]);
        
    } catch (err) {
        console.error('Error al obtener estadísticas:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Obtener estados disponibles
const obtenerEstadosOrden = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM estado_orden_compra WHERE activo = true ORDER BY estadoordenid
        `);
        
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error al obtener estados:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

module.exports = {
    listarOrdenesCompra,
    obtenerOrdenCompra,
    crearOrdenCompra,
    actualizarOrdenCompra,
    cambiarEstadoOrden,
    recibirProductos,
    cancelarOrdenCompra,
    obtenerEstadisticasOrdenes,
    obtenerEstadosOrden
};