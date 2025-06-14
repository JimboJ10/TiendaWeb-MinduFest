const pool = require('../db/pool');
const bcrypt = require('bcrypt-nodejs');

// ======================== GESTIÓN DE EMPLEADOS ========================

// Listar todos los empleados
const listarEmpleados = async (req, res) => {
    try {
        const { 
            departamento, 
            cargo, 
            estado = 'Activo', 
            filtro,
            limite = 50,
            pagina = 1 
        } = req.query;
        
        let query = `
            SELECT 
                e.empleadoid,
                e.codigo_empleado,
                e.fecha_ingreso,
                e.fecha_salida,
                e.salario_actual,
                e.tipo_contrato,
                e.estado_empleado,
                u.usuarioid,
                u.dni,
                u.nombres,
                u.apellidos,
                u.email,
                u.telefono,
                u.estado as estado_usuario,
                d.nombre as departamento,
                d.codigo as codigo_departamento,
                c.nombre as cargo,
                c.salario_base,
                supervisor.nombres || ' ' || supervisor.apellidos as supervisor,
                STRING_AGG(r.nombre, ', ') as roles
            FROM empleado e
            JOIN usuario u ON e.usuarioid = u.usuarioid
            LEFT JOIN departamento d ON e.departamentoid = d.departamentoid
            LEFT JOIN cargo c ON e.cargoid = c.cargoid
            LEFT JOIN empleado emp_supervisor ON e.supervisor_id = emp_supervisor.empleadoid
            LEFT JOIN usuario supervisor ON emp_supervisor.usuarioid = supervisor.usuarioid
            LEFT JOIN rol_usuario ru ON u.usuarioid = ru.usuarioid
            LEFT JOIN rol r ON ru.rolid = r.rolid
            WHERE 1=1
        `;
        
        const params = [];
        
        if (departamento && departamento !== 'todos') {
            query += ` AND e.departamentoid = $${params.length + 1}`;
            params.push(departamento);
        }
        
        if (cargo && cargo !== 'todos') {
            query += ` AND e.cargoid = $${params.length + 1}`;
            params.push(cargo);
        }
        
        if (estado !== 'todos') {
            query += ` AND e.estado_empleado = $${params.length + 1}`;
            params.push(estado);
        }
        
        if (filtro) {
            query += ` AND (
                u.nombres ILIKE $${params.length + 1} OR 
                u.apellidos ILIKE $${params.length + 1} OR 
                u.email ILIKE $${params.length + 1} OR 
                e.codigo_empleado ILIKE $${params.length + 1}
            )`;
            params.push(`%${filtro}%`);
        }
        
        query += ` GROUP BY e.empleadoid, u.usuarioid, d.departamentoid, c.cargoid, supervisor.nombres, supervisor.apellidos`;
        query += ` ORDER BY u.nombres, u.apellidos`;
        
        // Paginación
        const offset = (pagina - 1) * limite;
        query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limite, offset);
        
        const result = await pool.query(query, params);
        
        // Contar total para paginación
        let countQuery = `
            SELECT COUNT(DISTINCT e.empleadoid) as total
            FROM empleado e
            JOIN usuario u ON e.usuarioid = u.usuarioid
            LEFT JOIN departamento d ON e.departamentoid = d.departamentoid
            LEFT JOIN cargo c ON e.cargoid = c.cargoid
            WHERE 1=1
        `;
        
        const countParams = [];
        let paramIndex = 1;
        
        if (departamento && departamento !== 'todos') {
            countQuery += ` AND e.departamentoid = $${paramIndex}`;
            countParams.push(departamento);
            paramIndex++;
        }
        
        if (cargo && cargo !== 'todos') {
            countQuery += ` AND e.cargoid = $${paramIndex}`;
            countParams.push(cargo);
            paramIndex++;
        }
        
        if (estado !== 'todos') {
            countQuery += ` AND e.estado_empleado = $${paramIndex}`;
            countParams.push(estado);
            paramIndex++;
        }
        
        if (filtro) {
            countQuery += ` AND (
                u.nombres ILIKE $${paramIndex} OR 
                u.apellidos ILIKE $${paramIndex} OR 
                u.email ILIKE $${paramIndex} OR 
                e.codigo_empleado ILIKE $${paramIndex}
            )`;
            countParams.push(`%${filtro}%`);
        }
        
        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].total);
        
        res.status(200).json({
            empleados: result.rows,
            paginacion: {
                total,
                pagina: parseInt(pagina),
                limite: parseInt(limite),
                total_paginas: Math.ceil(total / limite)
            }
        });
    } catch (err) {
        console.error('Error al listar empleados:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Obtener empleado por ID
const obtenerEmpleado = async (req, res) => {
    try {
        const { id } = req.params;
        
        const empleadoQuery = `
            SELECT 
                e.*,
                u.dni,
                u.nombres,
                u.apellidos,
                u.email,
                u.telefono,
                u.pais,
                u."fNacimiento",
                u.genero,
                u.estado as estado_usuario,
                u.two_factor_enabled,
                u.fecha_creacion,
                d.nombre as departamento,
                d.codigo as codigo_departamento,
                c.nombre as cargo,
                c.salario_base as salario_base_cargo,
                supervisor.nombres || ' ' || supervisor.apellidos as supervisor_nombres
            FROM empleado e
            JOIN usuario u ON e.usuarioid = u.usuarioid
            LEFT JOIN departamento d ON e.departamentoid = d.departamentoid
            LEFT JOIN cargo c ON e.cargoid = c.cargoid
            LEFT JOIN empleado emp_supervisor ON e.supervisor_id = emp_supervisor.empleadoid
            LEFT JOIN usuario supervisor ON emp_supervisor.usuarioid = supervisor.usuarioid
            WHERE e.empleadoid = $1
        `;
        
        const empleadoResult = await pool.query(empleadoQuery, [id]);
        
        if (empleadoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }
        
        const empleado = empleadoResult.rows[0];
        
        // Obtener roles del empleado
        const rolesQuery = `
            SELECT r.rolid, r.nombre, r.descripcion, r.nivel_acceso
            FROM rol_usuario ru
            JOIN rol r ON ru.rolid = r.rolid
            WHERE ru.usuarioid = $1
        `;
        const rolesResult = await pool.query(rolesQuery, [empleado.usuarioid]);
        empleado.roles = rolesResult.rows;
        
        // Obtener permisos específicos
        const permisosQuery = `
            SELECT p.permisoid, p.nombre, p.descripcion, p.modulo, p.accion, p.codigo
            FROM usuario_permiso up
            JOIN permiso p ON up.permisoid = p.permisoid
            WHERE up.usuarioid = $1
        `;
        const permisosResult = await pool.query(permisosQuery, [empleado.usuarioid]);
        empleado.permisos = permisosResult.rows;
        
        // Obtener historial de cargos
        const historialQuery = `
            SELECT 
                hc.*,
                c.nombre as cargo_nombre,
                d.nombre as departamento_nombre,
                u.nombres || ' ' || u.apellidos as registrado_por
            FROM historial_cargo hc
            LEFT JOIN cargo c ON hc.cargoid = c.cargoid
            LEFT JOIN departamento d ON hc.departamentoid = d.departamentoid
            LEFT JOIN usuario u ON hc.usuarioid_registro = u.usuarioid
            WHERE hc.empleadoid = $1
            ORDER BY hc.fecha_inicio DESC
        `;
        const historialResult = await pool.query(historialQuery, [id]);
        empleado.historial_cargos = historialResult.rows;
        
        res.status(200).json(empleado);
    } catch (err) {
        console.error('Error al obtener empleado:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Crear nuevo empleado
const crearEmpleado = async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const {
            dni,
            nombres,
            apellidos,
            email,
            telefono,
            pais,
            fNacimiento,
            genero,
            password,
            codigo_empleado,
            fecha_ingreso,
            cargoid,
            departamentoid,
            salario_actual,
            tipo_contrato = 'Indefinido',
            supervisor_id,
            direccion_trabajo,
            observaciones,
            roles = [],
            permisos = []
        } = req.body;
        
        const usuarioid_registro = req.user.id;
        
        // VALIDAR Y LIMPIAR DATOS
        // Convertir valores vacíos a null
        const supervisorId = supervisor_id && supervisor_id !== '' ? parseInt(supervisor_id) : null;
        const telefonoFinal = telefono && telefono.trim() !== '' ? telefono.trim() : null;
        const fNacimientoFinal = fNacimiento && fNacimiento !== '' ? fNacimiento : null;
        const direccionTrabajoFinal = direccion_trabajo && direccion_trabajo.trim() !== '' ? direccion_trabajo.trim() : null;
        const observacionesFinal = observaciones && observaciones.trim() !== '' ? observaciones.trim() : null;
        
        // Validar que el email no exista
        const emailExiste = await client.query(
            'SELECT usuarioid FROM usuario WHERE email = $1',
            [email]
        );
        
        if (emailExiste.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'El email ya está registrado en el sistema' });
        }
        
        // Validar que el DNI no exista
        const dniExiste = await client.query(
            'SELECT usuarioid FROM usuario WHERE dni = $1',
            [dni]
        );
        
        if (dniExiste.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'El DNI ya está registrado en el sistema' });
        }
        
        // Generar código automático si no se proporciona
        let codigoEmpleado = codigo_empleado;
        if (!codigoEmpleado || codigoEmpleado.trim() === '') {
            const resultado = await client.query('SELECT generar_codigo_empleado() as codigo');
            codigoEmpleado = resultado.rows[0].codigo;
        } else {
            // Verificar que el código no exista
            const codigoExiste = await client.query(
                'SELECT empleadoid FROM empleado WHERE codigo_empleado = $1',
                [codigoEmpleado]
            );
            
            if (codigoExiste.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'El código de empleado ya existe' });
            }
        }
        
        // Encriptar contraseña
        const passwordHash = bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
        
        // 1. Crear usuario
        const usuarioResult = await client.query(`
            INSERT INTO usuario (
                dni, nombres, apellidos, email, telefono, pais,
                "fNacimiento", genero, password, tipo_usuario, estado
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING usuarioid
        `, [
            dni, nombres, apellidos, email, telefonoFinal, pais,
            fNacimientoFinal, genero, passwordHash, 'Empleado', 'Activo'
        ]);
        
        const usuarioid = usuarioResult.rows[0].usuarioid;
        
        // 2. Crear empleado
        const empleadoResult = await client.query(`
            INSERT INTO empleado (
                usuarioid, codigo_empleado, fecha_ingreso, cargoid,
                departamentoid, salario_actual, tipo_contrato,
                supervisor_id, direccion_trabajo, observaciones
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING empleadoid
        `, [
            usuarioid, codigoEmpleado, fecha_ingreso, cargoid,
            departamentoid, salario_actual, tipo_contrato,
            supervisorId, direccionTrabajoFinal, observacionesFinal
        ]);
        
        const empleadoid = empleadoResult.rows[0].empleadoid;
        
        // 3. Asignar roles
        if (roles && roles.length > 0) {
            for (const rolid of roles) {
                if (rolid && rolid !== '') {
                    await client.query(`
                        INSERT INTO rol_usuario (usuarioid, rolid)
                        VALUES ($1, $2)
                    `, [usuarioid, parseInt(rolid)]);
                }
            }
        }
        
        // 4. Asignar permisos específicos
        if (permisos && permisos.length > 0) {
            for (const permisoid of permisos) {
                if (permisoid && permisoid !== '') {
                    await client.query(`
                        INSERT INTO usuario_permiso (usuarioid, permisoid, otorgado_por)
                        VALUES ($1, $2, $3)
                    `, [usuarioid, parseInt(permisoid), usuarioid_registro]);
                }
            }
        }
        
        // 5. Crear historial inicial de cargo
        await client.query(`
            INSERT INTO historial_cargo (
                empleadoid, cargoid, departamentoid, fecha_inicio,
                salario, motivo, usuarioid_registro
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
            empleadoid, cargoid, departamentoid, fecha_ingreso,
            salario_actual, 'Ingreso inicial', usuarioid_registro
        ]);
        
        // 6. Registrar actividad
        await client.query(`
            INSERT INTO log_actividad_empleado (empleadoid, usuarioid, accion, modulo, detalle)
            VALUES ($1, $2, $3, $4, $5)
        `, [empleadoid, usuarioid_registro, 'Crear empleado', 'empleados', `Empleado creado: ${nombres} ${apellidos}`]);
        
        await client.query('COMMIT');
        
        res.status(201).json({
            message: 'Empleado creado exitosamente',
            empleadoid,
            usuarioid,
            codigo_empleado: codigoEmpleado
        });
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al crear empleado:', err);
        
        // Errores más específicos
        if (err.code === '23505') {
            if (err.constraint && err.constraint.includes('email')) {
                return res.status(400).json({ error: 'El email ya está registrado' });
            }
            if (err.constraint && err.constraint.includes('dni')) {
                return res.status(400).json({ error: 'El DNI ya está registrado' });
            }
            if (err.constraint && err.constraint.includes('codigo_empleado')) {
                return res.status(400).json({ error: 'El código de empleado ya existe' });
            }
        }
        
        res.status(500).json({ error: 'Error en el servidor al crear empleado' });
    } finally {
        client.release();
    }
};

// Actualizar empleado
const actualizarEmpleado = async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const { id } = req.params;
        const {
            // Datos usuario
            dni, nombres, apellidos, email, telefono, pais,
            fNacimiento, genero, password,
            
            // Datos empleado
            codigo_empleado, cargoid, departamentoid,
            salario_actual, tipo_contrato, supervisor_id,
            direccion_trabajo, observaciones, estado_empleado,
            
            // Roles y permisos
            roles = [],
            permisos = []
        } = req.body;
        
        const usuarioid_registro = req.user.id;
        
        // VALIDAR Y LIMPIAR DATOS
        // Convertir valores vacíos a null
        const telefonoFinal = telefono && telefono.trim() !== '' ? telefono.trim() : null;
        const fNacimientoFinal = fNacimiento && fNacimiento !== '' ? fNacimiento : null;
        const direccionTrabajoFinal = direccion_trabajo && direccion_trabajo.trim() !== '' ? direccion_trabajo.trim() : null;
        const observacionesFinal = observaciones && observaciones.trim() !== '' ? observaciones.trim() : null;
        
        // Convertir IDs a enteros o null
        const cargoIdFinal = cargoid && cargoid !== '' ? parseInt(cargoid) : null;
        const departamentoIdFinal = departamentoid && departamentoid !== '' ? parseInt(departamentoid) : null;
        const supervisorIdFinal = supervisor_id && supervisor_id !== '' ? parseInt(supervisor_id) : null;
        
        // Obtener empleado actual
        const empleadoActual = await client.query(
            'SELECT * FROM empleado WHERE empleadoid = $1',
            [id]
        );
        
        if (empleadoActual.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }
        
        const empleado = empleadoActual.rows[0];
        const usuarioid = empleado.usuarioid;
        
        // Verificar que el email no esté en uso por otro usuario
        const emailEnUso = await client.query(
            'SELECT usuarioid FROM usuario WHERE email = $1 AND usuarioid != $2',
            [email, usuarioid]
        );
        
        if (emailEnUso.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'El email ya está en uso por otro usuario' });
        }
        
        // Verificar que el DNI no esté en uso por otro usuario
        const dniEnUso = await client.query(
            'SELECT usuarioid FROM usuario WHERE dni = $1 AND usuarioid != $2',
            [dni, usuarioid]
        );
        
        if (dniEnUso.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'El DNI ya está en uso por otro usuario' });
        }
        
        // Actualizar usuario
        let updateUserQuery = `
            UPDATE usuario SET
                dni = $1, nombres = $2, apellidos = $3, email = $4,
                telefono = $5, pais = $6, "fNacimiento" = $7, genero = $8,
                fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE usuarioid = $9
        `;
        let userParams = [dni, nombres, apellidos, email, telefonoFinal, pais, fNacimientoFinal, genero, usuarioid];
        
        // Si se proporciona nueva contraseña
        if (password && password.trim() !== '') {
            const passwordHash = bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
            updateUserQuery = `
                UPDATE usuario SET
                    dni = $1, nombres = $2, apellidos = $3, email = $4,
                    telefono = $5, pais = $6, "fNacimiento" = $7, genero = $8,
                    password = $9, fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE usuarioid = $10
            `;
            userParams = [dni, nombres, apellidos, email, telefonoFinal, pais, fNacimientoFinal, genero, passwordHash, usuarioid];
        }
        
        await client.query(updateUserQuery, userParams);
        
        // Verificar si cambió el cargo o salario para historial
        const cambio_cargo = empleado.cargoid !== cargoIdFinal || parseFloat(empleado.salario_actual) !== parseFloat(salario_actual);
        
        // Actualizar empleado
        await client.query(`
            UPDATE empleado SET
                codigo_empleado = $1, cargoid = $2, departamentoid = $3,
                salario_actual = $4, tipo_contrato = $5, supervisor_id = $6,
                direccion_trabajo = $7, observaciones = $8, estado_empleado = $9,
                fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE empleadoid = $10
        `, [
            codigo_empleado, cargoIdFinal, departamentoIdFinal, salario_actual,
            tipo_contrato, supervisorIdFinal, direccionTrabajoFinal,
            observacionesFinal, estado_empleado, id
        ]);
        
        // Si cambió cargo/salario, registrar en historial
        if (cambio_cargo) {
            // Cerrar historial anterior
            await client.query(`
                UPDATE historial_cargo SET
                    fecha_fin = CURRENT_DATE
                WHERE empleadoid = $1 AND fecha_fin IS NULL
            `, [id]);
            
            // Crear nuevo historial solo si hay cargo asignado
            if (cargoIdFinal) {
                await client.query(`
                    INSERT INTO historial_cargo (
                        empleadoid, cargoid, departamentoid, fecha_inicio,
                        salario, motivo, usuarioid_registro
                    ) VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6)
                `, [
                    id, cargoIdFinal, departamentoIdFinal, salario_actual,
                    'Cambio de cargo/salario', usuarioid_registro
                ]);
            }
        }
        
        // Actualizar roles
        await client.query('DELETE FROM rol_usuario WHERE usuarioid = $1', [usuarioid]);
        for (const rolid of roles) {
            if (rolid && rolid !== '') {
                await client.query(
                    'INSERT INTO rol_usuario (usuarioid, rolid) VALUES ($1, $2)',
                    [usuarioid, parseInt(rolid)]
                );
            }
        }
        
        // Actualizar permisos específicos
        await client.query('DELETE FROM usuario_permiso WHERE usuarioid = $1', [usuarioid]);
        for (const permisoid of permisos) {
            if (permisoid && permisoid !== '') {
                await client.query(`
                    INSERT INTO usuario_permiso (usuarioid, permisoid, otorgado_por)
                    VALUES ($1, $2, $3)
                `, [usuarioid, parseInt(permisoid), usuarioid_registro]);
            }
        }
        
        // Registrar actividad
        await client.query(`
            INSERT INTO log_actividad_empleado (empleadoid, usuarioid, accion, modulo, detalle)
            VALUES ($1, $2, $3, $4, $5)
        `, [id, usuarioid_registro, 'Actualizar empleado', 'empleados', `Empleado actualizado: ${nombres} ${apellidos}`]);
        
        await client.query('COMMIT');
        
        res.status(200).json({ message: 'Empleado actualizado exitosamente' });
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al actualizar empleado:', err);
        
        // Errores más específicos
        if (err.code === '23505') {
            if (err.constraint && err.constraint.includes('email')) {
                return res.status(400).json({ error: 'El email ya está registrado' });
            }
            if (err.constraint && err.constraint.includes('dni')) {
                return res.status(400).json({ error: 'El DNI ya está registrado' });
            }
        }
        
        res.status(500).json({ error: 'Error en el servidor al actualizar empleado' });
    } finally {
        client.release();
    }
};

// Dar de baja empleado
const darBajaEmpleado = async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const { id } = req.params;
        const { fecha_salida, motivo = 'Baja del empleado' } = req.body;
        const usuarioid_registro = req.user.id;
        
        // Verificar que el empleado existe
        const empleado = await client.query(
            'SELECT usuarioid, codigo_empleado FROM empleado WHERE empleadoid = $1',
            [id]
        );
        
        if (empleado.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }
        
        const usuarioid = empleado.rows[0].usuarioid;
        const codigo_empleado = empleado.rows[0].codigo_empleado;
        
        // Dar de baja empleado
        await client.query(`
            UPDATE empleado SET
                fecha_salida = $1,
                estado_empleado = 'Retirado',
                fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE empleadoid = $2
        `, [fecha_salida, id]);
        
        // Desactivar usuario
        await client.query(`
            UPDATE usuario SET
                estado = 'Inactivo',
                fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE usuarioid = $1
        `, [usuarioid]);
        
        // Cerrar historial de cargo actual
        await client.query(`
            UPDATE historial_cargo SET
                fecha_fin = $1
            WHERE empleadoid = $2 AND fecha_fin IS NULL
        `, [fecha_salida, id]);
        
        // Registrar actividad
        await client.query(`
            INSERT INTO log_actividad_empleado (empleadoid, usuarioid, accion, modulo, detalle)
            VALUES ($1, $2, $3, $4, $5)
        `, [id, usuarioid_registro, 'Dar de baja', 'empleados', `Empleado dado de baja: ${codigo_empleado} - ${motivo}`]);
        
        await client.query('COMMIT');
        
        res.status(200).json({ message: 'Empleado dado de baja exitosamente' });
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al dar de baja empleado:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    } finally {
        client.release();
    }
};

// ======================== FUNCIONES AUXILIARES ========================

// Listar departamentos
const listarDepartamentos = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT d.*, COUNT(e.empleadoid) as total_empleados
            FROM departamento d
            LEFT JOIN empleado e ON d.departamentoid = e.departamentoid
            WHERE d.estado = 'Activo'
            GROUP BY d.departamentoid
            ORDER BY d.nombre
        `);
        
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error al listar departamentos:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Listar cargos
const listarCargos = async (req, res) => {
    try {
        const { departamentoid } = req.query;
        
        let query = `
            SELECT c.*, d.nombre as departamento_nombre
            FROM cargo c
            LEFT JOIN departamento d ON c.departamentoid = d.departamentoid
            WHERE c.estado = 'Activo'
        `;
        
        const params = [];
        
        if (departamentoid) {
            query += ` AND c.departamentoid = $1`;
            params.push(departamentoid);
        }
        
        query += ` ORDER BY d.nombre, c.nombre`;
        
        const result = await pool.query(query, params);
        
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error al listar cargos:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Listar roles
const listarRoles = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM rol 
            WHERE estado = 'Activo' 
            ORDER BY nivel_acceso DESC, nombre
        `);
        
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error al listar roles:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Listar permisos
const listarPermisos = async (req, res) => {
    try {
        const { modulo } = req.query;
        
        let query = `
            SELECT * FROM permiso 
            WHERE estado = 'Activo'
        `;
        
        const params = [];
        
        if (modulo) {
            query += ` AND modulo = $1`;
            params.push(modulo);
        }
        
        query += ` ORDER BY modulo, nombre`;
        
        const result = await pool.query(query, params);
        
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error al listar permisos:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Obtener estadísticas de empleados
const obtenerEstadisticasEmpleados = async (req, res) => {
    try {
        // Estadísticas generales
        const estadisticas = await pool.query(`
            SELECT 
                COUNT(*) as total_empleados,
                COUNT(CASE WHEN estado_empleado = 'Activo' THEN 1 END) as empleados_activos,
                COUNT(CASE WHEN estado_empleado = 'Inactivo' THEN 1 END) as empleados_inactivos,
                COUNT(CASE WHEN estado_empleado = 'Retirado' THEN 1 END) as empleados_retirados,
                
                -- SALARIO PROMEDIO SOLO DE EMPLEADOS ACTIVOS
                AVG(CASE WHEN estado_empleado = 'Activo' THEN salario_actual END) as salario_promedio_activos,
                
                -- SALARIO PROMEDIO GENERAL (TODOS)
                AVG(salario_actual) as salario_promedio_general,
                
                -- SALARIO MÁXIMO Y MÍNIMO DE ACTIVOS
                MAX(CASE WHEN estado_empleado = 'Activo' THEN salario_actual END) as salario_maximo,
                MIN(CASE WHEN estado_empleado = 'Activo' THEN salario_actual END) as salario_minimo,
                
                -- NUEVOS EMPLEADOS
                COUNT(CASE WHEN fecha_ingreso >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as nuevos_mes,
                COUNT(CASE WHEN fecha_ingreso >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as nuevos_semana
            FROM empleado
        `);
        
        // Por departamento (solo activos)
        const porDepartamento = await pool.query(`
            SELECT 
                d.nombre as departamento,
                COUNT(e.empleadoid) as cantidad,
                AVG(e.salario_actual) as salario_promedio_dept,
                MAX(e.salario_actual) as salario_maximo_dept,
                MIN(e.salario_actual) as salario_minimo_dept
            FROM departamento d
            LEFT JOIN empleado e ON d.departamentoid = e.departamentoid AND e.estado_empleado = 'Activo'
            GROUP BY d.departamentoid, d.nombre
            ORDER BY cantidad DESC
        `);
        
        // Por cargo (solo activos)
        const porCargo = await pool.query(`
            SELECT 
                c.nombre as cargo,
                COUNT(e.empleadoid) as cantidad,
                AVG(e.salario_actual) as salario_promedio_cargo
            FROM cargo c
            LEFT JOIN empleado e ON c.cargoid = e.cargoid AND e.estado_empleado = 'Activo'
            GROUP BY c.cargoid, c.nombre
            HAVING COUNT(e.empleadoid) > 0
            ORDER BY cantidad DESC
        `);
        
        // Resumen de contratos
        const porTipoContrato = await pool.query(`
            SELECT 
                tipo_contrato,
                COUNT(*) as cantidad,
                AVG(salario_actual) as salario_promedio_tipo
            FROM empleado
            WHERE estado_empleado = 'Activo'
            GROUP BY tipo_contrato
            ORDER BY cantidad DESC
        `);
        
        res.status(200).json({
            estadisticas: estadisticas.rows[0],
            por_departamento: porDepartamento.rows,
            por_cargo: porCargo.rows,
            por_tipo_contrato: porTipoContrato.rows
        });
        
    } catch (err) {
        console.error('Error al obtener estadísticas:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

const obtenerHistorialSalarios = async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = `
            SELECT 
                hc.historialid,
                hc.fecha_inicio,
                hc.fecha_fin,
                hc.salario,
                hc.motivo,
                hc.observaciones,
                c.nombre as cargo_nombre,
                d.nombre as departamento_nombre,
                u.nombres || ' ' || u.apellidos as registrado_por
            FROM historial_cargo hc
            LEFT JOIN cargo c ON hc.cargoid = c.cargoid
            LEFT JOIN departamento d ON hc.departamentoid = d.departamentoid
            LEFT JOIN usuario u ON hc.usuarioid_registro = u.usuarioid
            WHERE hc.empleadoid = $1
            ORDER BY hc.fecha_inicio DESC
        `;
        
        const result = await pool.query(query, [id]);
        
        // Formatear datos para simular cambios de salario
        const historialSalarios = result.rows.map((item, index) => {
            const anterior = result.rows[index + 1];
            return {
                fecha_cambio: item.fecha_inicio,
                salario_nuevo: item.salario,
                salario_anterior: anterior ? anterior.salario : 0,
                motivo: item.motivo,
                usuario_cambio: item.registrado_por
            };
        });
        
        res.status(200).json(historialSalarios);
    } catch (err) {
        console.error('Error al obtener historial de salarios:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Obtener historial de cargos
const obtenerHistorialCargos = async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = `
            SELECT 
                hc.historialid,
                hc.fecha_inicio,
                hc.fecha_fin,
                hc.motivo,
                hc.observaciones,
                c.nombre as cargo_actual,
                d.nombre as departamento_actual,
                u.nombres || ' ' || u.apellidos as registrado_por
            FROM historial_cargo hc
            LEFT JOIN cargo c ON hc.cargoid = c.cargoid
            LEFT JOIN departamento d ON hc.departamentoid = d.departamentoid
            LEFT JOIN usuario u ON hc.usuarioid_registro = u.usuarioid
            WHERE hc.empleadoid = $1
            ORDER BY hc.fecha_inicio DESC
        `;
        
        const result = await pool.query(query, [id]);
        
        // Formatear datos para simular cambios de cargo
        const historialCargos = result.rows.map((item, index) => {
            const anterior = result.rows[index + 1];
            return {
                fecha_cambio: item.fecha_inicio,
                cargo_nuevo: item.cargo_actual,
                cargo_anterior: anterior ? anterior.cargo_actual : 'Nuevo ingreso',
                departamento: item.departamento_actual,
                usuario_cambio: item.registrado_por
            };
        });
        
        res.status(200).json(historialCargos);
    } catch (err) {
        console.error('Error al obtener historial de cargos:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};
// ======================== GESTIÓN DE ROLES ========================

// Crear nuevo rol
const crearRol = async (req, res) => {
    try {
        const { nombre, descripcion, nivel_acceso, estado = 'Activo' } = req.body;
        const usuarioid_registro = req.user.id;
        
        // Validaciones
        if (!nombre || nombre.trim().length < 3) {
            return res.status(400).json({ error: 'El nombre del rol debe tener al menos 3 caracteres' });
        }
        
        if (!descripcion || descripcion.trim().length < 10) {
            return res.status(400).json({ error: 'La descripción debe tener al menos 10 caracteres' });
        }
        
        if (!nivel_acceso || nivel_acceso < 1 || nivel_acceso > 4) {
            return res.status(400).json({ error: 'El nivel de acceso debe estar entre 1 y 4' });
        }
        
        // Verificar que el nombre no exista
        const rolExiste = await pool.query(
            'SELECT rolid FROM rol WHERE LOWER(nombre) = LOWER($1)',
            [nombre.trim()]
        );
        
        if (rolExiste.rows.length > 0) {
            return res.status(400).json({ error: 'Ya existe un rol con ese nombre' });
        }
        
        // Crear rol
        const result = await pool.query(`
            INSERT INTO rol (nombre, descripcion, nivel_acceso, estado, fecha_creacion)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
            RETURNING rolid, nombre, descripcion, nivel_acceso, estado, fecha_creacion
        `, [nombre.trim(), descripcion.trim(), nivel_acceso, estado]);
        
        const nuevoRol = result.rows[0];
        
        res.status(201).json({
            message: 'Rol creado exitosamente',
            rol: nuevoRol
        });
        
    } catch (err) {
        console.error('Error al crear rol:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Obtener rol por ID
const obtenerRol = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            'SELECT * FROM rol WHERE rolid = $1',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Rol no encontrado' });
        }
        
        res.status(200).json(result.rows[0]);
        
    } catch (err) {
        console.error('Error al obtener rol:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Actualizar rol
const actualizarRol = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, nivel_acceso, estado } = req.body;
        
        // Validaciones
        if (!nombre || nombre.trim().length < 3) {
            return res.status(400).json({ error: 'El nombre del rol debe tener al menos 3 caracteres' });
        }
        
        if (!descripcion || descripcion.trim().length < 10) {
            return res.status(400).json({ error: 'La descripción debe tener al menos 10 caracteres' });
        }
        
        if (!nivel_acceso || nivel_acceso < 1 || nivel_acceso > 4) {
            return res.status(400).json({ error: 'El nivel de acceso debe estar entre 1 y 4' });
        }
        
        // Verificar que el rol existe
        const rolExiste = await pool.query(
            'SELECT rolid FROM rol WHERE rolid = $1',
            [id]
        );
        
        if (rolExiste.rows.length === 0) {
            return res.status(404).json({ error: 'Rol no encontrado' });
        }
        
        // Verificar que el nombre no esté en uso por otro rol
        const nombreEnUso = await pool.query(
            'SELECT rolid FROM rol WHERE LOWER(nombre) = LOWER($1) AND rolid != $2',
            [nombre.trim(), id]
        );
        
        if (nombreEnUso.rows.length > 0) {
            return res.status(400).json({ error: 'Ya existe otro rol con ese nombre' });
        }
        
        // Actualizar rol
        const result = await pool.query(`
            UPDATE rol SET
                nombre = $1,
                descripcion = $2,
                nivel_acceso = $3,
                estado = $4
            WHERE rolid = $5
            RETURNING *
        `, [nombre.trim(), descripcion.trim(), nivel_acceso, estado, id]);
        
        res.status(200).json({
            message: 'Rol actualizado exitosamente',
            rol: result.rows[0]
        });
        
    } catch (err) {
        console.error('Error al actualizar rol:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Eliminar rol
const eliminarRol = async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const { id } = req.params;
        
        // Verificar que el rol existe
        const rolExiste = await client.query(
            'SELECT nombre FROM rol WHERE rolid = $1',
            [id]
        );
        
        if (rolExiste.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Rol no encontrado' });
        }
        
        // Verificar que no hay usuarios asignados a este rol
        const usuariosConRol = await client.query(
            'SELECT COUNT(*) as total FROM rol_usuario WHERE rolid = $1',
            [id]
        );
        
        if (parseInt(usuariosConRol.rows[0].total) > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
                error: 'No se puede eliminar el rol porque tiene usuarios asignados' 
            });
        }
        
        // Eliminar rol
        await client.query(
            'DELETE FROM rol WHERE rolid = $1',
            [id]
        );
        
        await client.query('COMMIT');
        
        res.status(200).json({
            message: 'Rol eliminado exitosamente'
        });
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al eliminar rol:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    } finally {
        client.release();
    }
};

// Obtener empleados por rol
const obtenerEmpleadosPorRol = async (req, res) => {
    try {
        const { rolid } = req.params;
        
        const query = `
            SELECT 
                e.empleadoid,
                e.codigo_empleado,
                e.estado_empleado,
                u.usuarioid,
                u.nombres,
                u.apellidos,
                u.email,
                d.nombre as departamento,
                c.nombre as cargo,
                ru.fecha_asignacion
            FROM rol_usuario ru
            JOIN usuario u ON ru.usuarioid = u.usuarioid
            LEFT JOIN empleado e ON u.usuarioid = e.usuarioid
            LEFT JOIN departamento d ON e.departamentoid = d.departamentoid
            LEFT JOIN cargo c ON e.cargoid = c.cargoid
            WHERE ru.rolid = $1
            ORDER BY u.nombres, u.apellidos
        `;
        
        const result = await pool.query(query, [rolid]);
        
        res.status(200).json(result.rows);
        
    } catch (err) {
        console.error('Error al obtener empleados por rol:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// ======================== GESTIÓN DE PERMISOS ========================

// Crear nuevo permiso
const crearPermiso = async (req, res) => {
    try {
        const { nombre, descripcion, modulo, accion, codigo, estado = 'Activo' } = req.body;
        
        // Validaciones
        if (!nombre || nombre.trim().length < 3) {
            return res.status(400).json({ error: 'El nombre del permiso debe tener al menos 3 caracteres' });
        }
        
        if (!descripcion || descripcion.trim().length < 10) {
            return res.status(400).json({ error: 'La descripción debe tener al menos 10 caracteres' });
        }
        
        if (!modulo || !accion) {
            return res.status(400).json({ error: 'El módulo y la acción son requeridos' });
        }
        
        // Auto-generar código si no se proporciona
        const codigoPermiso = codigo && codigo.trim() ? codigo.trim() : `${modulo}.${accion}`;
        
        // Verificar que el código no exista
        const codigoExiste = await pool.query(
            'SELECT permisoid FROM permiso WHERE codigo = $1',
            [codigoPermiso]
        );
        
        if (codigoExiste.rows.length > 0) {
            return res.status(400).json({ error: 'Ya existe un permiso con ese código' });
        }
        
        // Crear permiso
        const result = await pool.query(`
            INSERT INTO permiso (nombre, descripcion, modulo, accion, codigo, estado)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING permisoid, nombre, descripcion, modulo, accion, codigo, estado
        `, [nombre.trim(), descripcion.trim(), modulo, accion, codigoPermiso, estado]);
        
        const nuevoPermiso = result.rows[0];
        
        res.status(201).json({
            message: 'Permiso creado exitosamente',
            permiso: nuevoPermiso
        });
        
    } catch (err) {
        console.error('Error al crear permiso:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Obtener permiso por ID
const obtenerPermiso = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            'SELECT * FROM permiso WHERE permisoid = $1',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Permiso no encontrado' });
        }
        
        res.status(200).json(result.rows[0]);
        
    } catch (err) {
        console.error('Error al obtener permiso:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Actualizar permiso
const actualizarPermiso = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, modulo, accion, codigo, estado } = req.body;
        
        // Validaciones
        if (!nombre || nombre.trim().length < 3) {
            return res.status(400).json({ error: 'El nombre del permiso debe tener al menos 3 caracteres' });
        }
        
        if (!descripcion || descripcion.trim().length < 10) {
            return res.status(400).json({ error: 'La descripción debe tener al menos 10 caracteres' });
        }
        
        if (!modulo || !accion) {
            return res.status(400).json({ error: 'El módulo y la acción son requeridos' });
        }
        
        // Verificar que el permiso existe
        const permisoExiste = await pool.query(
            'SELECT permisoid FROM permiso WHERE permisoid = $1',
            [id]
        );
        
        if (permisoExiste.rows.length === 0) {
            return res.status(404).json({ error: 'Permiso no encontrado' });
        }
        
        // Auto-generar código si no se proporciona
        const codigoPermiso = codigo && codigo.trim() ? codigo.trim() : `${modulo}.${accion}`;
        
        // Verificar que el código no esté en uso por otro permiso
        const codigoEnUso = await pool.query(
            'SELECT permisoid FROM permiso WHERE codigo = $1 AND permisoid != $2',
            [codigoPermiso, id]
        );
        
        if (codigoEnUso.rows.length > 0) {
            return res.status(400).json({ error: 'Ya existe otro permiso con ese código' });
        }
        
        // Actualizar permiso
        const result = await pool.query(`
            UPDATE permiso SET
                nombre = $1,
                descripcion = $2,
                modulo = $3,
                accion = $4,
                codigo = $5,
                estado = $6
            WHERE permisoid = $7
            RETURNING *
        `, [nombre.trim(), descripcion.trim(), modulo, accion, codigoPermiso, estado, id]);
        
        res.status(200).json({
            message: 'Permiso actualizado exitosamente',
            permiso: result.rows[0]
        });
        
    } catch (err) {
        console.error('Error al actualizar permiso:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Eliminar permiso
const eliminarPermiso = async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const { id } = req.params;
        
        // Verificar que el permiso existe
        const permisoExiste = await client.query(
            'SELECT nombre FROM permiso WHERE permisoid = $1',
            [id]
        );
        
        if (permisoExiste.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Permiso no encontrado' });
        }
        
        // Verificar que no hay usuarios con este permiso asignado
        const usuariosConPermiso = await client.query(
            'SELECT COUNT(*) as total FROM usuario_permiso WHERE permisoid = $1',
            [id]
        );
        
        if (parseInt(usuariosConPermiso.rows[0].total) > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
                error: 'No se puede eliminar el permiso porque está asignado a usuarios' 
            });
        }
        
        // Eliminar permiso
        await client.query(
            'DELETE FROM permiso WHERE permisoid = $1',
            [id]
        );
        
        await client.query('COMMIT');
        
        res.status(200).json({
            message: 'Permiso eliminado exitosamente'
        });
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al eliminar permiso:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    } finally {
        client.release();
    }
};

module.exports = {
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
};