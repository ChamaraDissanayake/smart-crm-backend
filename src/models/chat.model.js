// src/models/chat.model.js
const { pool } = require('../config/db.config');
const { v4: uuidv4 } = require('uuid');

// ✅ Find or create a thread
const findOrCreateThread = async ({ userId, companyId, channel = 'web' }) => {
    const conn = await pool.getConnection();
    try {
        const [rows] = await conn.query(
            `SELECT id FROM chat_threads 
             WHERE user_id = ? AND company_id = ? AND channel = ? AND is_active = TRUE
             ORDER BY created_at DESC LIMIT 1`,
            [userId, companyId, channel]
        );

        if (rows.length > 0) return rows[0].id;

        const threadId = uuidv4();
        await conn.query(
            `INSERT INTO chat_threads (id, user_id, company_id, channel, is_active) 
             VALUES (?, ?, ?, ?, ?)`,
            [threadId, userId, companyId, channel, true]
        );

        return threadId;
    } finally {
        conn.release();
    }
};

// ✅ Create a message
const saveMessage = async ({ thread_id, role, content }) => {
    const conn = await pool.getConnection();
    const msg_id = uuidv4();
    try {
        await conn.query(
            `INSERT INTO chat_messages (id, thread_id, role, content) VALUES (?, ?, ?, ?)`,
            [msg_id, thread_id, role, content]
        );
        return msg_id;
    } catch (err) {
        console.error("Failed to insert message:", err);
        throw err;
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

const getChatHistory = async ({ threadId, offset = 0 }) => {
    offset = Number(offset) || 0;
    const limit = 20;
    const conn = await pool.getConnection();
    try {
        const [rows] = await conn.query(
            `SELECT id, thread_id, role, content, created_at
             FROM chat_messages
             WHERE thread_id = ?
             ORDER BY created_at DESC 
             LIMIT ${limit} OFFSET ${offset}`,
            [threadId]
        );

        // Transform DB rows to match the Message interface
        const messages = rows.map(row => ({
            id: row.id,
            threadId: row.thread_id,
            role: row.role,
            content: row.content,
            createdAt: new Date(row.created_at).toISOString()
        }));

        return messages;
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

// Fetch all threads belongs to Company
const getThreadsByCompanyId = async ({ companyId }) => {
    const conn = await pool.getConnection();
    try {
        const [rows] = await conn.query(
            `SELECT id, customer_id, channel
             FROM chat_threads
             WHERE company_id = ? AND is_active = TRUE`,
            [companyId]
        );
        return rows;
    } finally {
        conn.release();
    }
};

const getChatThreadsWithCustomerInfo = async ({ companyId, channel }) => {
    const conn = await pool.getConnection();
    try {
        const params = [companyId];
        let channelFilter = '';

        if (channel && channel !== 'all') {
            channelFilter = ' AND t.channel = ?';
            params.push(channel);
        }

        const [rows] = await conn.query(
            `SELECT 
                t.id AS thread_id,
                t.customer_id,
                t.channel,
                c.name AS customer_name,
                c.phone AS customer_phone,
                c.email AS customer_email,
                m.content AS last_message,
                m.role AS last_message_role,
                m.created_at AS last_message_at
            FROM chat_threads t
            INNER JOIN customers c ON t.customer_id = c.id
            LEFT JOIN (
                SELECT cm1.thread_id, cm1.content, cm1.role, cm1.created_at
                FROM chat_messages cm1
                INNER JOIN (
                    SELECT thread_id, MAX(created_at) AS max_created_at
                    FROM chat_messages
                    GROUP BY thread_id
                ) cm2 ON cm1.thread_id = cm2.thread_id AND cm1.created_at = cm2.max_created_at
            ) m ON t.id = m.thread_id
            WHERE t.company_id = ? AND t.is_active = TRUE${channelFilter}`,
            params
        );

        return rows.map(row => ({
            id: row.thread_id,
            channel: row.channel,
            customer: {
                id: row.customer_id,
                name: row.customer_name,
                phone: row.customer_phone,
                email: row.customer_email
            },
            lastMessage: row.last_message
                ? {
                    content: row.last_message,
                    role: row.last_message_role,
                    createdAt: row.last_message_at
                }
                : null
        }));
    } catch (err) {
        console.error('Database error in getChatThreadsWithCustomerInfo:', err.message);
        throw new Error('Failed to fetch chat threads');
    } finally {
        conn.release();
    }
};

module.exports = {
    findOrCreateThread,
    saveMessage,
    getMessagesByThread,
    getChatHistory,
    deleteOldMessages,
    getThreadsByCompanyId,
    getChatThreadsWithCustomerInfo
};
