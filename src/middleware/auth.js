const jwt = require('jsonwebtoken');

const authenticate = async (req, res, next) => {
    // 1. Extract token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3. Attach user to request
        req.user = {
            id: decoded.userId,
            // Add other claims if needed (e.g., email, role)
            ...(decoded.email && { email: decoded.email })
        };

        next();
    } catch (err) {
        // 4. Handle specific JWT errors
        let errorMessage = 'Invalid token';
        let statusCode = 401;

        if (err.name === 'TokenExpiredError') {
            errorMessage = 'Token expired';
            statusCode = 403; // 403 Forbidden for expired tokens
        } else if (err.name === 'JsonWebTokenError') {
            errorMessage = 'Malformed token';
        }

        return res.status(statusCode).json({ error: errorMessage });
    }
};

module.exports = authenticate;