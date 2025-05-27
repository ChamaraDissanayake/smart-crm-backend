//src/app.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { initDB } = require('./config/db.config');
const routes = require('./routes/index.route');
const errorHandler = require('./middleware/error');
const path = require('path');
const { setupSocket } = require('./services/helpers/socket.helper.service');

const app = express();
const server = http.createServer(app);


// Apply CORS middleware
app.use(cors());

// Initialize Socket.IO with CORS configuration
setupSocket(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:4000',
        methods: ['GET', 'POST'],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true // For Socket.IO v2/v3 compatibility if needed
});

app.set('trust proxy', 1);

app.get("/test", (req, res) => {
    res.send("Chamara CRM API working");
});

// const { generateBotResponse } = require('./services/chat.service');

// (async () => {
//     try {
//         const { reply, threadId } = await generateBotResponse({ threadId: 'e832ca07-fdfa-49f4-9e56-1261e463492e', companyId: '1d4cedfe-800c-4c42-a76f-8db04466c5c6' });
//         console.log('Chamara reply', reply);
//         console.log('Chamara threadId', threadId);

//     } catch (err) {
//         console.error('Error fetching chat heads:', err);
//     }
// })();

// Initialize database
initDB().then(() => {
    // Middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Routes
    app.use('/api', routes);

    // Static files
    app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

    // Error handling - must be after all other middleware/routes
    app.use(errorHandler);

    // Start server
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
    });
}).catch(err => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
});

module.exports = { app, server };