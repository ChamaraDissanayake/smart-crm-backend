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
        return null;
    }
    const data = await customerModel.findCustomerByPhone({ phone, companyId }) || null;
    return data;
};

const createCustomer = async (params) => {
    const customer = {
        id: uuidv4(),
        ...params
    };

    await customerModel.insertCustomer(customer);
    return customer;
};

const updateCustomer = async (customer) => {
    return await customerModel.updateCustomer(customer);
};

const deleteCustomer = async (id) => {
    return await customerModel.deleteCustomer(id);
};

const getCustomersByCompanyId = async (companyId, limit = 1000, offset = 0) => {
    try {
        return await customerModel.getCustomersByCompanyId({ companyId, limit, offset });
    } catch (error) {
        console.log(error);
        throw new Error('Failed to fetch customers', error);
    }
};

const getCustomerCountByCompanyId = async (companyId) => {
    try {
        return await customerModel.getCustomerCountByCompanyId(companyId);
    } catch (error) {
        console.log(error);
        throw new Error('Failed to fetch customer count', error);
    }
};

module.exports = {
    getOrCreateCustomerByPhone,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomersByCompanyId,
    findCustomerByPhone,
    getCustomerCountByCompanyId
};
