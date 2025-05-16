// src/models/chat.model.js
const { pool } = require('../config/db.config');
const { v4: uuidv4 } = require('uuid');

// ✅ Find or create a thread
const findOrCreateThread = async ({ userId, companyId, channel = 'bot' }) => {
    const conn = await pool.getConnection();
    try {
        const [rows] = await conn.query(
            `SELECT id FROM chat_threads 
             WHERE user_id = ? AND company_id = ? AND channel = ?
             ORDER BY created_at DESC LIMIT 1`,
            [userId, companyId, channel]
        );

        if (rows.length > 0) return rows[0].id;

        const threadId = uuidv4();
        await conn.query(
            `INSERT INTO chat_threads (id, user_id, company_id, channel) 
             VALUES (?, ?, ?, ?)`,
            [threadId, userId, companyId, channel]
        );

        return threadId;
    } finally {
        conn.release();
    }
};

// ✅ Create a message
const createMessage = async ({ thread_id, role, content }) => {
    const conn = await pool.getConnection();
    try {
        await conn.query(
            `INSERT INTO chat_messages (thread_id, role, content) VALUES (?, ?, ?)`,
            [thread_id, role, content]
        );
    } finally {
        conn.release();
    }
};

// ✅ Get messages by thread
const getMessagesByThread = async ({ threadId, limit = 10, offset = 0 }) => {
    const conn = await pool.getConnection();
    try {
        const [rows] = await conn.query(
            `SELECT role, content, created_at 
             FROM chat_messages 
             WHERE thread_id = ? 
             ORDER BY id DESC 
             LIMIT ? OFFSET ?`,
            [threadId, limit, offset]
        );
        return rows;
    } finally {
        conn.release();
    }
};

// ✅ Get full chat history for a user/company/channel
const getChatHistory = async ({ userId, companyId, channel = 'bot', limit = 20, offset = 0 }) => {
    const conn = await pool.getConnection();
    try {
        const [rows] = await conn.query(
            `SELECT cm.role, cm.content, cm.created_at 
             FROM chat_threads ct
             JOIN chat_messages cm ON ct.id = cm.thread_id
             WHERE ct.user_id = ? AND ct.company_id = ? AND ct.channel = ?
             ORDER BY cm.created_at DESC 
             LIMIT ? OFFSET ?`,
            [userId, companyId, channel, limit, offset]
        );
        return rows;
    } finally {
        conn.release();
    }
};

// ✅ Delete old messages
const deleteOldMessages = async () => {
    const conn = await pool.getConnection();
    try {
        const [result] = await conn.query(
            `DELETE FROM chat_messages 
             WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)`
        );
        return result.affectedRows;
    } finally {
        conn.release();
    }
};

module.exports = {
    findOrCreateThread,
    createMessage,
    getMessagesByThread,
    getChatHistory,
    deleteOldMessages
};
