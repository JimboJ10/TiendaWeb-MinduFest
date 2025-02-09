const pool = require('../db/pool');
const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const saltRounds = 10;
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true para 465, false para otros puertos
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});


const listarUsuariosConRoles = async(req, res) => {
    try {
        const client = await pool.connect();
        console.log('Conexión exitosa');

        const query = `
            SELECT u.usuarioId, u.dni, u.nombres, u.apellidos, u.email, u.pais, u."fNacimiento", r.nombre AS rol
            FROM usuario u
            JOIN rol_usuario ru ON u.usuarioId = ru.usuarioId
            JOIN rol r ON ru.rolId = r.rolId
        `;
        const result = await client.query(query);
        client.release();
        res.json(result.rows);
    } catch (err) {
        console.error('Error al listar usuarios con roles:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

const registerUserAdmin = async(req, res) => {
    const { dni, nombres, apellidos, email, pais, password, telefono, fNacimiento, genero } = req.body;

    let client;

    try {
        const hashedPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(saltRounds));

        client = await pool.connect();
        await client.query('BEGIN');

        const insertUserQuery = `
            INSERT INTO usuario (dni, nombres, apellidos, email, pais, password, telefono, "fNacimiento", genero)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING usuarioId;
        `;
        const values = [dni, nombres, apellidos, email, pais, hashedPassword, telefono, fNacimiento, genero];
        const result = await client.query(insertUserQuery, values);

        console.log('Resultado de la inserción de usuario:', result.rows);

        const userId = result.rows[0].usuarioid;

        console.log('User ID:', userId);

        if (!userId) {
            throw new Error('No se obtuvo el userId al insertar el usuario');
        }

        const insertRoleQuery = `
            INSERT INTO rol_usuario (usuarioId, rolId)
            VALUES ($1, $2);
        `;
        await client.query(insertRoleQuery, [userId, 2]);

        await client.query('COMMIT');
        client.release();

        res.status(201).json({ message: 'Usuario registrado correctamente', result: result.rows[0] });
    } catch (err) {
        if (client) {
            try {
                await client.query('ROLLBACK');
            } catch (rollbackErr) {
                console.error('Error al revertir la transacción:', rollbackErr);
            } finally {
                client.release();
            }
        }
        console.error('Error al registrar usuario:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

const registerUser = async(req, res) => {
    const { dni, nombres, apellidos, email, pais, password, telefono, fNacimiento, genero } = req.body;

    let client;

    try {
        const hashedPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(saltRounds));

        client = await pool.connect();
        await client.query('BEGIN');

        const insertUserQuery = `
            INSERT INTO usuario (dni, nombres, apellidos, email, pais, password, telefono, "fNacimiento", genero)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING usuarioId;
        `;
        const values = [dni, nombres, apellidos, email, pais, hashedPassword, telefono, fNacimiento, genero];
        const result = await client.query(insertUserQuery, values);

        console.log('Resultado de la inserción de usuario:', result.rows);

        const userId = result.rows[0].usuarioid;

        console.log('User ID:', userId);

        if (!userId) {
            throw new Error('No se obtuvo el userId al insertar el usuario');
        }

        const insertRoleQuery = `
            INSERT INTO rol_usuario (usuarioId, rolId)
            VALUES ($1, $2);
        `;
        await client.query(insertRoleQuery, [userId, 1]);

        await client.query('COMMIT');
        client.release();

        res.status(201).json({ message: 'Usuario registrado correctamente', result: result.rows[0] });
    } catch (err) {
        if (client) {
            try {
                await client.query('ROLLBACK');
            } catch (rollbackErr) {
                console.error('Error al revertir la transacción:', rollbackErr);
            } finally {
                client.release();
            }
        }
        console.error('Error al registrar usuario:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Función para restablecer contraseña
const solicitarRestablecimiento = async (req, res) => {
    try {
        const { email } = req.body;
        
        // Primero verificar si el email existe
        const client = await pool.connect();
        const userResult = await client.query(
            'SELECT * FROM usuario WHERE email = $1',
            [email]
        );
        
        if (userResult.rows.length === 0) {
            client.release();
            return res.status(404).json({ 
                message: 'No existe una cuenta con este correo electrónico' 
            });
        }
        
        const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const resetLink = `${process.env.FRONTEND_URL}/restablecer-password?token=${token}`;
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Restablecer contraseña',
            html: `
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h3 style="color: #333;">Restablecer contraseña</h3>
                    <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace:</p>
                    <a href="${resetLink}" 
                       style="display: inline-block; 
                              padding: 10px 20px; 
                              background-color: #007bff; 
                              color: white; 
                              text-decoration: none; 
                              border-radius: 5px;">
                        Restablecer contraseña
                    </a>
                    <p style="color: #666; margin-top: 20px;">
                        Este enlace expirará en 1 hora. Si no solicitaste restablecer tu contraseña, 
                        puedes ignorar este mensaje.
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        client.release();
        res.status(200).json({ message: 'Correo enviado con éxito' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al enviar el correo' });
    }
};

const restablecerPassword = async (req, res) => {
    const { token, newPassword } = req.body;
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const hashedPassword = bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10));
        
        const client = await pool.connect();
        const result = await client.query(
            'UPDATE usuario SET password = $1 WHERE email = $2 RETURNING email',
            [hashedPassword, decoded.email]
        );
        client.release();

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                message: 'Usuario no encontrado' 
            });
        }

        res.status(200).json({ 
            message: 'Contraseña actualizada con éxito' 
        });
    } catch (error) {
        console.error(error);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                message: 'El enlace ha expirado' 
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                message: 'Token inválido' 
            });
        }
        res.status(500).json({ 
            message: 'Error al restablecer la contraseña' 
        });
    }
};

module.exports = {
    listarUsuariosConRoles,
    registerUser,
    registerUserAdmin,
    restablecerPassword,
    solicitarRestablecimiento
};