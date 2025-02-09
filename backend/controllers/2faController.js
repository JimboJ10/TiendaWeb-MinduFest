const { generateTwoFactorSecret, generateQRCode, verifyTwoFactorCode } = require('../utils/twoFactorUtils');
const pool = require('../db/pool');

const configurar2FA = async (req, res) => {
    const { email } = req.body;
    try {
        const secret = generateTwoFactorSecret({ email });
        const qrCode = await generateQRCode(secret);
        await pool.query('UPDATE usuario SET two_factor_secret = $1 WHERE email = $2', [secret.base32, email]);
        return res.json({ secret: secret.base32, qrCode });
    } catch (error) {
        return res.status(500).json({ error: 'Error al configurar la autenticación de dos factores' });
    }
};

const verificar2FA = (req, res) => {
    const { token, secret } = req.body;
    const isValid = verifyTwoFactorCode({ base32: secret }, token);
    if (isValid) {
        return res.json({ success: true });
    } else {
        return res.status(400).json({ error: 'Token de autenticación incorrecto' });
    }
};

const cambiarEstado2FA = async (req, res) => {
    const { email, enabled } = req.body;
    try {
        await pool.query(
            'UPDATE usuario SET two_factor_enabled = $1 WHERE email = $2',
            [enabled, email]
        );
        return res.json({
            success: true,
            message: enabled ? '2FA activado' : '2FA desactivado'
        });
    } catch (error) {
        return res.status(500).json({ error: 'Error al modificar la configuración de 2FA' });
    }
};

const obtenerEstado2FA = async (req, res) => {
    const { email } = req.params;
    try {
        const result = await pool.query(
            'SELECT two_factor_enabled FROM usuario WHERE email = $1',
            [email]
        );
        if (result.rows.length > 0) {
            return res.json({ enabled: result.rows[0].two_factor_enabled });
        }
        return res.status(404).json({ error: 'Usuario no encontrado' });
    } catch (error) {
        return res.status(500).json({ error: 'Error al obtener el estado de 2FA' });
    }
};

module.exports = {
    configurar2FA,
    verificar2FA,
    cambiarEstado2FA,
    obtenerEstado2FA
};