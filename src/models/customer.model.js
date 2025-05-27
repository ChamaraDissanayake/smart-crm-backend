const { pool } = require('../config/db.config');

const findCustomerByPhone = async ({ phone, companyId }) => {
    const conn = await pool.getConnection();
    try {
        const [rows] = await conn.query(
            `SELECT id FROM customers WHERE phone = ? AND company_id = ?`,
            [phone, companyId]
        );
        return rows[0] || null;
    } finally {
        conn.release();
    }
};

const insertCustomer = async (customer) => {
    const conn = await pool.getConnection();
    try {
        const query = `
            INSERT INTO customers (id, name, phone, email, company_id)
            VALUES (?, ?, ?, ?, ?)
        `;

        const values = [
            customer.id,
            customer.name,
            customer.phone,
            customer.email,
            customer.companyId,
        ];

        await conn.query(query, values);
        return { id: customer.id };
    } catch (err) {
        console.error('Error inserting customer:', err);
        throw new Error('Failed to insert customer');
    } finally {
        conn.release();
    }
};

const getCustomerById = async ({ customerId }) => {
    const conn = await pool.getConnection();
    try {
        const [rows] = await conn.query(
            `SELECT name, phone, email
             FROM customer
             WHERE id = ?`,
            [customerId]
        );
        return rows;
    } finally {
        conn.release();
    }
}

const getCustomersByIds = async ({ customerIds }) => {
    if (!Array.isArray(customerIds) || customerIds.length === 0) {
        return []; // or throw an error if you want to enforce input
    }

    const conn = await pool.getConnection();
    try {
        const placeholders = customerIds.map(() => '?').join(', ');
        const [rows] = await conn.query(
            `SELECT id, name, phone, email FROM customer WHERE id IN (${placeholders})`,
            customerIds
        );
        return rows; // rows will already be an array of objects
    } finally {
        conn.release();
    }
};


module.exports = {
    findCustomerByPhone,
    insertCustomer,
    getCustomerById,
    getCustomersByIds
};
