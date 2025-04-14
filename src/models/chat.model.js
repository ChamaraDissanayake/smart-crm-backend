const { pool } = require('../config/db.config');

module.exports = {
    async createThread(id, user_id) {
        const [result] = await pool.query(
            'INSERT INTO chat_threads (id, user_id) VALUES (?, ?)',
            [id, user_id]
        );
        return result.insertId;
    },

    async getThreadByUserId(user_id) {
        const [rows] = await pool.query(
            'SELECT id FROM chat_threads WHERE user_id = ?',
            [user_id]
        );
        return rows[0];
    },

    async createMessage(thread_id, role, content) {
        const [result] = await pool.query(
            'INSERT INTO chat_messages (thread_id, role, content) VALUES (?, ?, ?)',
            [thread_id, role, content]
        );
        return result.insertId;
    },

    async getMessagesByThread(thread_id, limit = 10, offset = 0) {
        const [rows] = await pool.query(
            'SELECT role, content, timestamp FROM chat_messages WHERE thread_id = ? ORDER BY id DESC LIMIT ? OFFSET ?',
            [thread_id, limit, offset]
        );
        return rows;
    },

    async deleteOldMessages() {
        const [result] = await pool.query(
            "DELETE FROM chat_messages WHERE timestamp < DATE_SUB(NOW(), INTERVAL 30 DAY)"
        );
        return result.affectedRows;
    },

    async getChatHistory(user_id, limit, offset) {
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
    }

};
