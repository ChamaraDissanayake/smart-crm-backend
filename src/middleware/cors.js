// src/middleware/cors.js

const cors = require('cors');

const publicCors = cors({
    origin: function (origin, callback) {
        callback(null, origin || '*');
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
});

module.exports = { publicCors };
