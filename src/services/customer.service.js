const { v4: uuidv4 } = require('uuid');
const { findCustomerByPhone, insertCustomer } = require('../models/customer.model');

const getOrCreateCustomerByPhone = async ({ phone, companyId }) => {
    const existing = await findCustomerByPhone({ phone, companyId });
    if (existing) return existing.id;

    const customerId = uuidv4();
    await insertCustomer({ id: customerId, phone, companyId });
    return customerId;
};

module.exports = {
    getOrCreateCustomerByPhone,
};
