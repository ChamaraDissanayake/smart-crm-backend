const jwt = require('jsonwebtoken');

const generateJWT = (payload, expiresIn) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

const decodeJWT = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        throw new Error('Invalid token');
    }
}

module.exports = {
    generateJWT,
    decodeJWT
};