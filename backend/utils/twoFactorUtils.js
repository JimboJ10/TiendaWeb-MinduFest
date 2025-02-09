const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

const generateTwoFactorSecret = (user) => {
    const secret = speakeasy.generateSecret({ name: `MinduFest (${user.email})` });
    return secret;
};

const generateQRCode = async (secret) => {
    const qrCodeUrl = secret.otpauth_url;
    const qrCode = await qrcode.toDataURL(qrCodeUrl);
    return qrCode;
};

const verifyTwoFactorCode = (secret, token) => {
    return speakeasy.totp.verify({
        secret: secret.base32,
        encoding: 'base32', // es un tipo de codificación
        token: token,
        window: 1 // Permite una diferencia de tiempo de 1 intervalo de 30 a 60 segundos
    });
};

module.exports = {
    generateTwoFactorSecret,
    generateQRCode,
    verifyTwoFactorCode
};