const { pool } = require('../config/db.config');

const getAllPlans = async () => {
    const [rows] = await pool.query(
        'SELECT * FROM subscriptions',
    );
    return rows;
};

const addSubscription = async (data) => {
    console.log('Chamara data', data);

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const startDate = new Date();
        let endDate = new Date(startDate);
        let renewalDate;

        if (data.billingCycle === 'monthly') {
            endDate.setMonth(endDate.getMonth() + 1);
        } else if (data.billingCycle === 'yearly') {
            endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
            throw new Error('Invalid billing cycle: must be "monthly" or "yearly".');
        }

        renewalDate = new Date(endDate); // Same as endDate

        await conn.query(
            `UPDATE companies SET plan_id = ? WHERE id = ?`,
            [data.planId, data.companyId]
        );

        await conn.query(
            `INSERT INTO company_subscriptions (
                company_id, plan_id, billing_cycle, start_date, end_date, renewal_date, auto_renew, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.companyId,
                data.planId,
                data.billingCycle,
                startDate,
                endDate,
                renewalDate,
                true,
                'active'
            ]
        );

        await conn.commit();
        return true;
    } catch (err) {
        console.log('Error in subscription model:', err);

        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

module.exports = {
    getAllPlans,
    addSubscription
}