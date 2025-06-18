const jwt = require('jsonwebtoken');

const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // ✅ Check internal token first
    if (token === process.env.INTERNAL_UPLOAD_TOKEN) {
        req.user = { id: 'internal', role: 'system' };
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
            id: decoded.userId,
            ...(decoded.email && { email: decoded.email })
        };
        next();
    } catch (err) {
        let errorMessage = 'Invalid token';
        let statusCode = 401;

        if (err.name === 'TokenExpiredError') {
            errorMessage = 'Token expired';
            statusCode = 403;
        } else if (err.name === 'JsonWebTokenError') {
            errorMessage = 'Malformed token';
        }

        return res.status(statusCode).json({ error: errorMessage });
    }
};

module.exports = authenticate;