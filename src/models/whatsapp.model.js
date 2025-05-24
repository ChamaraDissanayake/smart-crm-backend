const { pool } = require('../config/db.config');
const {
    saveMessage,
    getMessagesByThread,
    getChatHistory,
    deleteOldMessages,
} = require('./chat.model');
const { v4: uuidv4 } = require('uuid');

const getWhatsAppIntegration = async ({ companyId, phoneNumberId }) => {
    const conn = await pool.getConnection();
    try {
        let query = `
            SELECT access_token, phone_number_id, company_id 
            FROM whatsapp_integrations 
            WHERE is_active = TRUE
        `;
        const params = [];

        if (companyId) {
            query += ` AND company_id = ?`;
            params.push(companyId);
        } else if (phoneNumberId) {
            query += ` AND phone_number_id = ?`;
            params.push(phoneNumberId);
        } else {
            throw new Error('Either companyId or phoneNumberId must be provided');
        }

        query += ` LIMIT 1`;

        const [rows] = await conn.query(query, params);
        return rows[0] || null;
    } finally {
        conn.release();
    }
};

const findOrCreateWhatsAppThread = async ({ customerId, companyId, channel = 'whatsapp' }) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Lock matching threads for this customer/company/channel
        const [threads] = await conn.query(
            `SELECT id, current_handler, assigned_agent_id FROM chat_threads 
             WHERE customer_id = ? AND company_id = ? AND channel = ? AND is_active = TRUE 
             ORDER BY started_at DESC 
             LIMIT 1
             FOR UPDATE`,
            [customerId, companyId, channel]
        );

        if (threads.length > 0) {
            await conn.commit();
            return threads[0];
        }

        // If no active thread found, create a new one
        const threadId = uuidv4();
        await conn.query(
            `INSERT INTO chat_threads (id, customer_id, company_id, assigned_agent_id, channel, is_active) 
             VALUES (?, ?, ?, NULL, ?, TRUE)`,
            [threadId, customerId, companyId, channel]
        );

        await conn.commit();
        return { id: threadId, current_handler: 'bot', assigned_agent_id: null };
    } catch (err) {
        await conn.rollback();
        console.error('Error in findOrCreateThread:', err);
        throw err;
    } finally {
        conn.release();
    }
};

const saveWhatsAppMessage = async ({ thread_id, role, content }) => {
    return await saveMessage({ thread_id, role, content });
};

const getWhatsAppMessagesByThread = async ({ threadId, limit = 10, offset = 0 }) => {
    return await getMessagesByThread({ threadId, limit, offset });
};

const getWhatsAppChatHistory = async ({ userId, companyId, limit = 20, offset = 0 }) => {
    return await getChatHistory({ userId, companyId, channel: 'whatsapp', limit, offset });
};

module.exports = {
    findOrCreateWhatsAppThread,
    saveWhatsAppMessage,
    getWhatsAppMessagesByThread,
    getWhatsAppChatHistory,
    deleteOldMessages,
    getWhatsAppIntegration
};
