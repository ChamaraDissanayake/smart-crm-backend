const { pool } = require('../config/db.config');


const createThread = async (id, user_id) => {
    const [result] = await pool.query(
        'INSERT INTO chat_threads (id, user_id) VALUES (?, ?)',
        [id, user_id]
    );
    return result.insertId;
};

const getThreadByUserId = async (user_id) => {
    const [rows] = await pool.query(
        'SELECT id FROM chat_threads WHERE user_id = ?',
        [user_id]
    );
    return rows[0];
};

const createMessage = async (thread_id, role, content) => {
    const [result] = await pool.query(
        'INSERT INTO chat_messages (thread_id, role, content) VALUES (?, ?, ?)',
        [thread_id, role, content]
    );
    return result.insertId;
};

const getMessagesByThread = async (thread_id, limit = 10, offset = 0) => {
    const [rows] = await pool.query(
        'SELECT role, content, timestamp FROM chat_messages WHERE thread_id = ? ORDER BY id DESC LIMIT ? OFFSET ?',
        [thread_id, limit, offset]
    );
    return rows;
};

const deleteOldMessages = async () => {
    const [result] = await pool.query(
        "DELETE FROM chat_messages WHERE timestamp < DATE_SUB(NOW(), INTERVAL 30 DAY)"
    );
    return result.affectedRows;
};

const getChatHistory = async (user_id, limit, offset) => {
    // Convert to numbers to avoid SQL syntax issues
    limit = Number(limit);
    offset = Number(offset);

    const [result] = await pool.query(
        `SELECT cm.role, cm.content, cm.timestamp 
             FROM chat_threads ct 
             JOIN chat_messages cm ON ct.id = cm.thread_id 
             WHERE ct.user_id = ? 
             ORDER BY cm.timestamp DESC 
             LIMIT ? OFFSET ?`,
        [user_id, limit, offset]
    );

    return result;
};

module.exports = {
    createThread,
    getThreadByUserId,
    createMessage,
    getMessagesByThread,
    deleteOldMessages,
    getChatHistory
};
