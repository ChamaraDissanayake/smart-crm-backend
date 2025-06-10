// src/models/chat.model.js

const { pool } = require('../config/db.config');
const { v4: uuidv4 } = require('uuid');

// ✅ Find or create a thread
const findOrCreateThread = async ({ customerId, companyId, channel = 'web' }) => {
    const conn = await pool.getConnection();
    let isNewThread = false;
    let threadResult = null;
    console.log('Thread channel', channel);

    try {
        await conn.beginTransaction();

        const [threads] = await conn.query(
            `SELECT id, current_handler, assigned_agent_id, company_id FROM chat_threads 
             WHERE customer_id = ? AND company_id = ? AND channel = ? AND is_active = TRUE 
             ORDER BY created_at DESC 
             LIMIT 1
             FOR UPDATE`,
            [customerId, companyId, channel]
        );

        if (threads.length > 0) {
            threadResult = threads[0];
        } else {
            const threadId = uuidv4();
            await conn.query(
                `INSERT INTO chat_threads (id, customer_id, company_id, assigned_agent_id, channel, is_active) 
                 VALUES (?, ?, ?, NULL, ?, TRUE)`,
                [threadId, customerId, companyId, channel]
            );

            isNewThread = true;
            threadResult = {
                id: threadId,
                current_handler: 'bot',
                assigned_agent_id: null,
                company_id: companyId,
            };
        }

        await conn.commit();

        return { thread: threadResult, isNewThread };
    } catch (err) {
        await conn.rollback();
        console.error('Error in findOrCreateThread:', err);
        throw err;
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
const getMessagesByThread = async ({ threadId, limit = 1000, offset = 0 }) => {
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

const checkThreadExists = async (threadId) => {
    const conn = await pool.getConnection();
    try {
        const [rows] = await conn.query(
            `SELECT 1 FROM chat_threads WHERE id = ? AND is_active = TRUE LIMIT 1;`,
            [threadId]
        );
        return rows.length > 0;
    } finally {
        conn.release();
    }
};

const getChatHistory = async ({ threadId, limit, offset }) => {
    const conn = await pool.getConnection();
    try {
        const [rows] = await conn.query(
            `SELECT id, thread_id, role, content, created_at
             FROM chat_messages
             WHERE thread_id = ?
             ORDER BY created_at DESC 
             LIMIT ? OFFSET ?`,
            [threadId, limit, offset]
        );

        return rows.map(row => ({
            id: row.id,
            threadId: row.thread_id,
            role: row.role,
            content: row.content,
            createdAt: new Date(row.created_at).toISOString()
        }));
    } finally {
        conn.release();
    }
};

// ✅ Delete old messages to reduce load
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

const getThreadById = async ({ threadId }) => {

    const conn = await pool.getConnection();
    try {
        const [rows] = await conn.query(
            `SELECT *
             FROM chat_threads
             WHERE id = ?`,
            [threadId]
        );
        return rows[0] || null;
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
                t.assigned_agent_id,
                t.current_handler,
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
            WHERE t.company_id = ? AND t.is_active = TRUE${channelFilter}
            ORDER BY m.created_at DESC`,
            params
        );

        return rows.map(row => ({
            id: row.thread_id,
            channel: row.channel,
            assignee: row.assigned_agent_id,
            currentHandler: row.current_handler,
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

const markAsDone = async ({ threadId }) => {
    const [result] = await pool.query(
        'UPDATE chat_threads SET is_active = FALSE, closed_at = CURRENT_TIMESTAMP WHERE id = ?',
        [threadId]
    );
    return result.affectedRows > 0;
}

const assignChat = async ({ threadId, chatHandler, assignedAgentId }) => {
    let setClause = `current_handler = ?, assigned_agent_id = ?`;
    const values = [chatHandler, assignedAgentId || null];

    if (chatHandler === 'agent') {
        setClause += `, handover_to_agent_at = CURRENT_TIMESTAMP`;
    } else if (chatHandler === 'bot') {
        setClause += `, handover_to_bot_at = CURRENT_TIMESTAMP`;
    }

    const query = `UPDATE chat_threads SET ${setClause} WHERE id = ?`;
    values.push(threadId);

    const [result] = await pool.query(query, values);
    return result.affectedRows > 0;
};

module.exports = {
    findOrCreateThread,
    saveMessage,
    getMessagesByThread,
    getChatHistory,
    deleteOldMessages,
    getThreadsByCompanyId,
    getChatThreadsWithCustomerInfo,
    checkThreadExists,
    markAsDone,
    assignChat,
    getThreadById
};
