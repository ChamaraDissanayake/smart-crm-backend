const { pool } = require('../config/db.config');

const create = async ({ name, industry, location, size }) => {
    const [result] = await pool.query(
        `INSERT INTO companies (name, industry, location, size)
     VALUES (?, ?, ?, ?)`,
        [name, industry, location, size]
    );
    return result.insertId;
};

const findByName = async (name) => {
    const [rows] = await pool.query(
        'SELECT * FROM companies WHERE name = ? AND is_deleted = FALSE',
        [name]
    );
    return rows[0];
};

const findById = async (id) => {
    const [rows] = await pool.query(
        'SELECT * FROM companies WHERE id = ? AND is_deleted = FALSE',
        [id]
    );
    return rows[0];
};

const findByUserId = async (userId) => {
    const [rows] = await pool.query(
        `SELECT c.* FROM companies c
     JOIN company_members cm ON c.id = cm.company_id
     WHERE cm.user_id = ? AND c.is_deleted = FALSE AND cm.is_deleted = FALSE`,
        [userId]
    );
    return rows;
};

const update = async (id, { name, industry, location, size }) => {
    const [result] = await pool.query(
        `UPDATE companies 
     SET name = ?, industry = ?, location = ?, size = ?
     WHERE id = ? AND is_deleted = FALSE`,
        [name, industry, location, size, id]
    );
    return result.affectedRows > 0;
};

const softDelete = async (id) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        await conn.query(
            'UPDATE companies SET is_deleted = TRUE WHERE id = ?',
            [id]
        );

        await conn.query(
            'UPDATE company_members SET is_deleted = TRUE WHERE company_id = ?',
            [id]
        );

        await conn.commit();
        return true;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

const addMember = async (userId, companyId, role = 'member') => {
    const [result] = await pool.query(
        `INSERT INTO company_members (user_id, company_id, role)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE role = ?, is_deleted = FALSE`,
        [userId, companyId, role, role]
    );
    return result.affectedRows > 0;
};

const removeMember = async (userId, companyId) => {
    const [result] = await pool.query(
        'UPDATE company_members SET is_deleted = TRUE WHERE user_id = ? AND company_id = ?',
        [userId, companyId]
    );
    return result.affectedRows > 0;
};

const getUserRole = async (userId, companyId) => {
    const [rows] = await pool.query(
        'SELECT role FROM company_members WHERE user_id = ? AND company_id = ? AND is_deleted = FALSE',
        [userId, companyId]
    );
    return rows[0]?.role;
};

module.exports = {
    create,
    findByName,
    findById,
    findByUserId,
    update,
    softDelete,
    addMember,
    removeMember,
    getUserRole
};