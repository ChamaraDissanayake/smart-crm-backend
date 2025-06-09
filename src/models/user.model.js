const { pool } = require('../config/db.config');
const bcrypt = require('bcrypt');

const create = async ({ id, name, email, phone, password, provider, google_id }) => {
    let hashedPassword = null;
    let isVerified = true;

    if (provider === 'email') {
        hashedPassword = await bcrypt.hash(password, 10);
        isVerified = false;
    }

    const [result] = await pool.query(
        `INSERT INTO users (id, name, email, phone, password, provider, google_id, is_verified) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, name, email, phone, hashedPassword, provider, google_id, isVerified]
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
    const [rows] = await pool.query(
        'SELECT * FROM users WHERE email = ? AND is_deleted = FALSE',
        [email]
    );
    return rows[0];
};

const findById = async (id) => {
    const [rows] = await pool.query(
        'SELECT * FROM users WHERE id = ? AND is_deleted = FALSE',
        [id]
    );
    return rows[0];
};

const deleteUserByEmail = async (email) => {
    try {
        // Soft delete instead of hard delete
        const [result] = await pool.query(
            'UPDATE users SET is_deleted = TRUE WHERE email = ?',
            [email]
        );
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

// New method to check email availability
const checkEmailExists = async (email) => {
    const [rows] = await pool.query(
        'SELECT 1 FROM users WHERE email = ? AND is_deleted = FALSE',
        [email]
    );
    return rows.length > 0;
}

const checkIsVerifiedUser = async (email) => {
    try {
        const [rows] = await pool.query(
            'SELECT id AS userId, is_verified FROM users WHERE email = ? AND is_deleted = FALSE',
            [email]
        );

        if (rows.length > 0) {
            const { userId, is_verified } = rows[0];
            return { userId, is_verified };
        } else {
            return { userId: null, is_verified: false };
        }
    } catch (error) {
        console.error(error);
        return null;
    }
};

const getUsersByCompanyId = async (companyId) => {
    try {
        const [rows] = await pool.query(
            `SELECT u.*
            FROM users u
            INNER JOIN company_members cm ON u.id = cm.user_id
            WHERE cm.company_id = ?
            AND u.is_deleted = FALSE
            AND cm.is_deleted = FALSE`,
            [companyId]
        );
        return rows;
    } catch (error) {
        return error
    }
};

module.exports = {
    create,
    findByEmail,
    findById,
    deleteUserByEmail,
    updatePassword,
    updateVerificationStatus,
    checkEmailExists,
    checkIsVerifiedUser,
    getUsersByCompanyId
};