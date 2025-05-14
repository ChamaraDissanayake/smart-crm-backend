// src/models/message.model.js
import { pool } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

export const findOrCreateThread = async ({ userId, companyId, channel }) => {
    const conn = await pool.getConnection();
    try {
        const [rows] = await conn.query(
            'SELECT id FROM chat_threads WHERE user_id = ? AND company_id = ? AND channel = ? LIMIT 1',
            [userId, companyId, channel]
        );

        if (rows.length > 0) {
            return rows[0].id;
        }

        const threadId = uuidv4();
        await conn.query(
            'INSERT INTO chat_threads (id, user_id, company_id, channel) VALUES (?, ?, ?, ?)',
            [threadId, userId, companyId, channel]
        );
        return threadId;
    } finally {
        conn.release();
    }
};

export const createMessage = async ({ thread_id, role, content }) => {
    const conn = await pool.getConnection();
    try {
        await conn.query(
            'INSERT INTO chat_messages (thread_id, role, content) VALUES (?, ?, ?)',
            [thread_id, role, content]
        );
    } finally {
        conn.release();
    }
};