const jwt = require('jsonwebtoken');
const moment = require('moment');

const secret = process.env.JWT_SECRET;

exports.createToken = function(user) {
    const payload = {
        sub: user.usuarioid,
        nombres: user.nombres,
        apellidos: user.apellidos,
        email: user.email,
        rol: user.rol,
        iat: moment().unix(),
        exp: moment().add(1, 'days').unix()
    };

    return jwt.sign(payload, secret);
};

exports.verifyToken = function(token) {
    try {
        return jwt.verify(token, secret);
    } catch (err) {
        return null;
    }
};
