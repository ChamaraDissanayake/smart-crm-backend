const { pool } = require('../config/db.config');

const findCustomerByPhone = async ({ phone, companyId }) => {
    const conn = await pool.getConnection();
    try {
        const [rows] = await conn.query(
            `SELECT id, name, phone, email, location, is_company, code 
             FROM customers 
             WHERE phone = ? AND company_id = ? AND is_active = TRUE`,
            [normalizePhone(phone), companyId]
        );

        if (!rows.length) return null;

        const row = rows[0];

        // Map snake_case fields to camelCase
        return {
            id: row.id,
            name: row.name,
            phone: row.phone,
            email: row.email,
            location: row.location,
            isCompany: row.is_company,
            code: row.code
        };
    } finally {
        conn.release();
    }
};

const insertCustomer = async (customer) => {
    const conn = await pool.getConnection();
    try {
        const query = `
            INSERT INTO customers (id, name, phone, email, company_id, location, is_company, code)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            customer.id,
            customer.name,
            normalizePhone(customer.phone),
            customer.email,
            customer.companyId,
            customer.location,
            customer.isCompany,
            customer.code
        ];

        await conn.query(query, values);

        return {
            ...customer,
            phone: normalizePhone(customer.phone)
        };
    } catch (err) {
        console.error('Error inserting customer:', err);
        throw new Error('Failed to insert customer');
    } finally {
        conn.release();
    }
};


const updateCustomer = async (customer) => {
    const conn = await pool.getConnection();
    try {
        const query = `
            UPDATE customers
            SET name = ?, email = ?, location = ?, is_company = ?, code = ?, phone = ?
            WHERE id = ?
        `;

        const values = [
            customer.name,
            customer.email,
            customer.location,
            customer.isCompany,
            customer.code,
            normalizePhone(customer.phone),
            customer.id
        ];

        await conn.query(query, values);

        return {
            ...customer,
            phone: normalizePhone(customer.phone)
        };
    } catch (err) {
        console.error('Error updating customer:', err);
        throw new Error('Failed to update customer');
    } finally {
        conn.release();
    }
};

const deleteCustomer = async (id) => {
    let connection;
    try {
        // Get a connection from the pool
        connection = await pool.getConnection();

        // Begin transaction
        await connection.beginTransaction();

        // Soft delete customer
        const [customerResult] = await connection.query(
            'UPDATE customers SET is_active = FALSE WHERE id = ?',
            [id]
        );

        if (customerResult.affectedRows === 0) {
            await connection.rollback();
            return false; // Customer not found
        }

        // Soft delete all threads belonging to this customer
        const [threadsResult] = await connection.query(
            'UPDATE chat_threads SET is_active = FALSE WHERE customer_id = ?',
            [id]
        );

        // Commit the transaction
        await connection.commit();

        return true;
    } catch (error) {
        // Rollback in case of error
        if (connection) await connection.rollback();
        console.error('Error deleting customer:', error);
        return false;
    } finally {
        // Release the connection back to the pool
        if (connection) connection.release();
    }
};

// These functions are commented out as they are not currently used in the application.
// const getCustomerById = async ({ customerId }) => {
//     const conn = await pool.getConnection();
//     try {
//         const [rows] = await conn.query(
//             `SELECT name, phone, email
//              FROM customer
//              WHERE id = ? AND is_active = TRUE`,
//             [customerId]
//         );
//         return rows;
//     } finally {
//         conn.release();
//     }
// }

// const getCustomersByIds = async ({ customerIds }) => {
//     if (!Array.isArray(customerIds) || customerIds.length === 0) {
//         return []; // or throw an error if you want to enforce input
//     }

//     const conn = await pool.getConnection();
//     try {
//         const placeholders = customerIds.map(() => '?').join(', ');
//         const [rows] = await conn.query(
//             `SELECT id, name, phone, email FROM customer WHERE id IN (${placeholders}) AND is_active = TRUE`,
//             customerIds
//         );
//         return rows; // rows will already be an array of objects
//     } finally {
//         conn.release();
//     }
// };

const getCustomersByCompanyId = async ({ companyId, limit = 1000, offset = 0 }) => {
    const conn = await pool.getConnection();
    try {
        const [rows] = await conn.query(
            `SELECT 
                c.id, 
                c.name, 
                c.code, 
                c.phone, 
                c.email, 
                c.location, 
                c.is_company, 
                c.updated_at,
                GROUP_CONCAT(DISTINCT t.channel) AS channels
             FROM customers c
             LEFT JOIN chat_threads t 
                ON t.customer_id = c.id AND t.is_active = TRUE
             WHERE c.company_id = ? AND c.is_active = TRUE
             GROUP BY c.id
             ORDER BY c.created_at DESC
             LIMIT ? OFFSET ?`,
            [companyId, limit, offset]
        );

        const transformedRows = rows.map(row => {
            const { is_company, updated_at, channels, ...rest } = row;
            return {
                ...rest,
                isCompany: is_company,
                updatedAt: updated_at,
                channels: channels ? channels.split(',') : [],
            };
        });
        return transformedRows;
    } finally {
        conn.release();
    }
};

const getCustomerCountByCompanyId = async (companyId) => {
    const conn = await pool.getConnection();
    try {
        const [rows] = await conn.query(
            `SELECT COUNT(*) as count 
             FROM customers 
             WHERE company_id = ? AND is_active = TRUE`,
            [companyId]
        );

        return rows[0]?.count || 0;
    } finally {
        conn.release();
    }
};

const normalizePhone = (phone) => {
    if (!phone) return phone;
    return phone.startsWith('+') ? phone.slice(1) : phone;
};


module.exports = {
    findCustomerByPhone,
    insertCustomer,
    updateCustomer,
    deleteCustomer,
    // getCustomerById,
    // getCustomersByIds,
    getCustomersByCompanyId,
    getCustomerCountByCompanyId
};
