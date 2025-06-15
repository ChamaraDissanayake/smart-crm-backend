// src/services/helpers/socket.helper.service.js

let io = null;

const setupSocket = (server, socketConfig = {}) => {
    const { Server } = require('socket.io');
    io = new Server(server, {
        ...socketConfig,
        path: '/socket.io',
        pingInterval: 25000, // Every 25 seconds, send ping to client
        pingTimeout: 60000,  // Wait 60 seconds for pong response
        connectionStateRecovery: {
            maxDisconnectionDuration: 2 * 60 * 1000,
        }
    });

    // Main namespace
    io.of('/').on('connection', (socket) => {
        console.log('🧠 New client connected:', socket.id);

        socket.on('join-thread', (threadId) => {
            const room = `thread:${threadId}`;
            socket.join(room);
            console.log(`📥 Socket ${socket.id} joined ${room}`);
        });

        socket.on('join-company', (companyId) => {
            const room = `company:${companyId}`;
            socket.join(room);
            console.log(`📥 Socket ${socket.id} joined ${room}`);
        });


        socket.on('disconnect', () => {
            console.log('❌ Client disconnected:', socket.id);
        });
    });

    return io;
};

const emitToThread = (threadId, data) => {

    const eventName = 'new-message';

    if (!io) {
        console.warn('Socket.IO not initialized');
        return;
    }
    io.of('/').to(`thread:${threadId}`).emit(eventName, data);
    console.log(`📤 Emitted ${eventName} to thread ${threadId}. Message: ${data.content}`);
};

const emitToCompany = (companyId, data) => {

    const eventName = 'new-thread';

    if (!io) {
        console.warn('Socket.IO not initialized');
        return;
    }
    io.of('/').to(`company:${companyId}`).emit(eventName, data);
    console.log(`📤 Emitted ${eventName} to company ${companyId}.`);
};

module.exports = {
    setupSocket,
    emitToThread,
    emitToCompany
};