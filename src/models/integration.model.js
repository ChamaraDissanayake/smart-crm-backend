// src/integration.model.js
const { pool } = require('../config/db.config');
const { v4: uuidv4 } = require('uuid');

const saveIntegration = async (userId, accessToken) => {
    const id = uuidv4();
    const conn = await pool.getConnection();
    try {
        await conn.query(`
            INSERT INTO facebook_integrations (id, user_id, access_token)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE access_token = VALUES(access_token), created_at = CURRENT_TIMESTAMP
        `, [id, userId, accessToken]);
    } finally {
        conn.release();
    }
};

const getIntegrationByUserId = async (userId) => {
    const conn = await pool.getConnection();
    try {
        const [rows] = await conn.query(
            `SELECT * FROM facebook_integrations WHERE user_id = ?`,
            [userId]
        );
        return rows[0];
    } finally {
        conn.release();
    }
};

const deleteIntegration = async (userId) => {
    const conn = await pool.getConnection();
    try {
        await conn.query(
            `DELETE FROM facebook_integrations WHERE user_id = ?`,
            [userId]
        );
    } finally {
        conn.release();
    }
};

const saveWhatsAppIntegration = async ({
    userId,
    companyId,
    accessToken,
    whatsappBusinessAccountId,
    phoneNumberId,
    phoneNumber,
    businessName
}) => {
    const id = uuidv4();
    const conn = await pool.getConnection();
    try {
        await conn.query(`
      INSERT INTO whatsapp_integrations (
        id, company_id, access_token,
        whatsapp_business_account_id, phone_number_id,
        phone_number, business_name
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        access_token = VALUES(access_token),
        phone_number_id = VALUES(phone_number_id),
        phone_number = VALUES(phone_number),
        business_name = VALUES(business_name),
        updated_at = CURRENT_TIMESTAMP
    `, [
            id, companyId, accessToken,
            whatsappBusinessAccountId, phoneNumberId,
            phoneNumber, businessName
        ]);
    } finally {
        conn.release();
    }
};

module.exports = {
    saveIntegration,
    getIntegrationByUserId,
    deleteIntegration,
    saveWhatsAppIntegration
};