//src/services/customer.service.js

const { v4: uuidv4 } = require('uuid');
const customerModel = require('../models/customer.model');

// Using this for WhatsApp customer creation
const getOrCreateCustomerByPhone = async ({ phone, companyId, name = null, email = null }) => {
    const existing = await findCustomerByPhone({ phone, companyId });
    if (existing) return existing.id;

    const customerId = uuidv4();
    const customer = {
        companyId,
        id: customerId,
        name,
        phone,
        email
    };
    await customerModel.insertCustomer(customer);
    return customerId;
};

const findCustomerByPhone = async ({ phone, companyId }) => {
    if (!phone || !companyId) {
        throw new Error('Missing required fields: phone, companyId');
    }
    return await customerModel.findCustomerByPhone({ phone, companyId }) || null;
};

const createCustomer = async ({ companyId, name, phone, email, location, isCompany = false, code }) => {
    const customer = {
        id: uuidv4(),
        companyId,
        name,
        phone,
        email,
        location,
        isCompany,
        code
    };

    await customerModel.insertCustomer(customer);
    return customer;
};

const getCustomersByCompanyId = async (companyId, limit = 10, offset = 0) => {
    try {
        return await customerModel.getCustomersByCompanyId({ companyId, limit, offset });
    } catch (error) {
        console.log(error);
        throw new Error('Failed to fetch customers', error);
    }
};

module.exports = {
    getOrCreateCustomerByPhone,
    createCustomer,
    getCustomersByCompanyId,
    findCustomerByPhone
};
