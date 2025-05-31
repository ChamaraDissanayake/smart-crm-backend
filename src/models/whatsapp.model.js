const { pool } = require('../config/db.config');

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


module.exports = {
    getWhatsAppIntegration
};
