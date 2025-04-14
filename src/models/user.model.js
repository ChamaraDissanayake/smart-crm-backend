const { pool } = require('../config/db.config');
const bcrypt = require('bcrypt');

const create = async ({ name, email, phone, password, provider, google_id }) => {
    let hashedPassword = null;
    let isVerified = true;

    if (provider === 'email') {
        hashedPassword = await bcrypt.hash(password, 10); // Only hash password if provider is 'email'
        isVerified = false; // Set is_verified to false for email provider
    }

    const [result] = await pool.query(
        `INSERT INTO users (name, email, phone, password, provider, google_id, is_verified) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, email, phone, hashedPassword, provider, google_id, isVerified]
    );

    return result.insertId;
};

const updateVerificationStatus = async (id, isVerified) => {
    const [result] = await pool.query(
        'UPDATE users SET is_verified = ? WHERE id = ?',
        [isVerified, id]
    );
    return result.affectedRows > 0;
};

const findByEmail = async (email) => {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
};

const findById = async (id) => {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
};

const deleteUserByEmail = async (email) => {
    try {
        const [result] = await pool.query('DELETE FROM users WHERE email = ?', [email]);
        return result.affectedRows > 0;
    } catch (error) {
        return false;
    }

};

const updatePassword = async (id, newPassword) => {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const [result] = await pool.query(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, id]
    );
    return result.affectedRows > 0;
}

module.exports = {
    create,
    findByEmail,
    findById,
    deleteUserByEmail,
    updatePassword,
    updateVerificationStatus
};