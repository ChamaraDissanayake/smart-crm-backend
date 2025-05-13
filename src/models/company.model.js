const { pool } = require('../config/db.config');

const create = async ({ id, name, industry, location, size, chatbotInstructions }) => {
    const [result] = await pool.query(
        `INSERT INTO companies (id, name, industry, location, size, chatbot_instruction)
     VALUES (?, ?, ?, ?, ?, ?)`,
        [id, name, industry, location, size, chatbotInstructions]
    );
    return result.insertId;
};

const updateDefaultCompany = async (userId, companyId) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        await conn.query(
            `UPDATE company_members 
             SET is_default = FALSE 
             WHERE user_id = ?`,
            [userId]
        );

        await conn.query(
            `UPDATE company_members 
             SET is_default = TRUE 
             WHERE user_id = ? AND company_id = ?`,
            [userId, companyId]
        );

        await conn.commit();
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
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
        `SELECT 
            c.id,
            c.name,
            c.industry,
            c.location,
            c.size,
            c.plan_id as planId,
            c.is_active as isActive,
            cm.is_default as isDefault
         FROM companies c
         JOIN company_members cm ON c.id = cm.company_id
         WHERE cm.user_id = ? AND c.is_deleted = FALSE AND cm.is_deleted = FALSE`,
        [userId]
    );
    return rows;
};

const getSelectedCompanyByUserId = async (userId) => {
    const [rows] = await pool.query(`
        SELECT c.*
        FROM companies c
        JOIN company_members cm ON cm.company_id = c.id
        WHERE cm.user_id = ? 
          AND cm.is_default = TRUE 
          AND cm.is_deleted = FALSE 
          AND c.is_deleted = FALSE
        LIMIT 1;`,
        [userId]);
    return rows[0];
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
    // Check if user is already a member of any company
    const existingCompanies = await findByUserId(userId);
    const isDefault = existingCompanies.length === 0;

    const [result] = await pool.query(
        `INSERT INTO company_members (user_id, company_id, role, is_default)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           role = VALUES(role), 
           is_deleted = FALSE, 
           is_default = VALUES(is_default)`,
        [userId, companyId, role, isDefault]
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

const updateCompanyPlan = async (planId, companyId) => {
    const [rows] = await pool.query(
        `UPDATE companies SET plan_id = ? WHERE id = ?`,
        [planId, companyId]
    );
    return rows[0];
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
    getUserRole,
    updateCompanyPlan,
    getSelectedCompanyByUserId,
    updateDefaultCompany
};