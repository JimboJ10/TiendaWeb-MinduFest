const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { verifyTwoFactorCode } = require('../utils/twoFactorUtils');

const login = async (req, res) => {
    const { email, password, twoFactorCode } = req.body;

    try {
        const client = await pool.connect();
        const query = `
            SELECT u.usuarioid, u.nombres, u.email, u.password, u.two_factor_secret, 
                u.two_factor_enabled, r.nombre AS rol
            FROM usuario u
            JOIN rol_usuario ru ON u.usuarioid = ru.usuarioid
            JOIN rol r ON ru.rolid = r.rolid
            WHERE u.email = $1
        `;
        const result = await client.query(query, [email]);
        client.release();

        if (result.rows.length > 0) {
            const user = result.rows[0];
            const isMatch = bcrypt.compareSync(password, user.password);

            if (isMatch) {
                // Verifica si 2FA está habilitado
                if (user.two_factor_enabled) {
                    if (!twoFactorCode) {
                        return res.status(200).json({
                            requiresTwoFactor: true,
                            message: 'Se requiere código de autenticación de dos factores' 
                        });
                    }

                    const isValid = verifyTwoFactorCode(
                        { base32: user.two_factor_secret }, 
                        twoFactorCode
                    );

                    if (!isValid) {
                        return res.status(401).json({ 
                            error: 'Código de autenticación incorrecto' 
                        });
                    }
                }

                const token = jwt.sign(
                    { usuarioid: user.usuarioid, rol: user.rol }, 
                    process.env.JWT_SECRET,
                    { expiresIn: '1h' }
                );
                
                return res.json({ 
                    token, 
                    usuarioid: user.usuarioid, 
                    rol: user.rol, 
                    nombres: user.nombres, 
                    email: user.email
                });
            }
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }
        return res.status(401).json({ error: 'Usuario no encontrado' });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error en el servidor' });
    }
};

module.exports = {
    login
};