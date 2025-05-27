//src/services/customer.service.js

const { v4: uuidv4 } = require('uuid');
const { findCustomerByPhone, insertCustomer } = require('../models/customer.model');

const getOrCreateCustomerByPhone = async ({ phone, companyId }) => {
    const existing = await findCustomerByPhone({ phone, companyId });
    if (existing) return existing.id;

    const customerId = uuidv4();
    const customer = {
        companyId,
        id: customerId,
        name: null,
        phone,
        email: null
    };
    await insertCustomer(customer);
    return customerId;
};

const createCustomer = async (companyId, customerId, name, phone, email) => {
    const customer = {
        companyId,
        id: customerId,
        name,
        phone,
        email
    };

    return insertCustomer(customer);
};

module.exports = {
    getOrCreateCustomerByPhone,
    createCustomer
};
