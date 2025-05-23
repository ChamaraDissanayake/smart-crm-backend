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
        const fields = ['id', 'phone', 'company_id'];
        const values = [customer.id, customer.phone, customer.companyId];

        if (customer.name) {
            fields.push('name');
            values.push(customer.name);
        }

        if (customer.email) {
            fields.push('email');
            values.push(customer.email);
        }

        const placeholders = fields.map(() => '?').join(', ');
        const query = `INSERT INTO customers (${fields.join(', ')}) VALUES (${placeholders})`;

        await conn.query(query, values);
        return { id: customer.id };
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
