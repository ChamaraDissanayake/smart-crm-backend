// src/controllers/customer.controller.js
const customerService = require('../services/customer.service');
const { findOrCreateThread } = require('../services/chat.service');

// This controller handles creating a customer thread for Chat Bot
const createCustomerThread = async (req, res) => {
    const { companyId, name, phone, email, channel } = req.body;

    if (!companyId) {
        return res.status(400).json({ error: 'Missing required field: companyId' });
    }

    try {
        let customer = await customerService.findCustomerByPhone({ phone, companyId });

        if (!customer) {
            customer = await customerService.createCustomer({ companyId, name, phone, email });
        }

        const thread = await findOrCreateThread({
            customerId: customer.id,
            companyId,
            channel: channel || 'web'
        });

        res.json({ threadId: thread.id, customerId: customer.id });

    } catch (err) {
        console.error('Error in createCustomerThread:', err);
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

// This controller handles creating a customer from CRM
const createCustomer = async (req, res) => {
    try {
        const { companyId, name, phone, email, location, isCompany, code } = req.body;

        if (!companyId || !name) {
            return res.status(400).json({ error: 'Missing required fields: companyId, name' });
        }

        let customer = await customerService.findCustomerByPhone({ phone, companyId });

        if (customer) {
            customer = await customerService.updateCustomer({ companyId, name, phone, email, location, isCompany, code, id: customer.id });
        } else {
            customer = await customerService.createCustomer({ companyId, name, phone, email, location, isCompany, code });
        }
        res.json({ customer });
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

const updateCustomer = async (req, res) => {
    try {
        const { id, name, phone, email, location, isCompany, code, companyId } = req.body;

        if (!id) {
            return res.status(400).json({ error: 'Missing required fields: id' });
        }

        if (phone) {
            const currentCustomer = await customerService.findCustomerByPhone({ phone, companyId });

            if (currentCustomer && currentCustomer?.id !== id) {
                return res.status(400).json({ error: "Bad request!" });
            }
        }

        const customer = await customerService.updateCustomer({ id, name, phone, email, location, isCompany, code, companyId });
        res.json({ customer });
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

const deleteCustomer = async (req, res) => {
    try {
        await customerService.deleteCustomer(req.params.id);
        res.json({ message: 'Customer deleted successfully' });
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

const getCustomersByCompanyId = async (req, res) => {
    const { companyId, limit, offset } = req.query;

    if (!companyId) {
        return res.status(400).json({ error: 'Missing required field: companyId' });
    }

    try {
        const customers = await customerService.getCustomersByCompanyId(companyId, parseInt(limit), parseInt(offset));

        res.json({ contacts: customers });
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

const getCustomerCountByCompanyId = async (req, res) => {
    const { companyId } = req.query;

    if (!companyId) {
        return res.status(400).json({ error: 'Missing required field: companyId' });
    }

    try {
        const customerCount = await customerService.getCustomerCountByCompanyId(companyId);
        res.json({ customerCount });
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

module.exports = {
    createCustomerThread,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomersByCompanyId,
    getCustomerCountByCompanyId
};