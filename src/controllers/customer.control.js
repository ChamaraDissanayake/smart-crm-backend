// src/controllers/customer.controller.js

const customerService = require('../services/customer.service');
const { findOrCreateThread } = require('../services/chat.service');

// This controller handles creating a customer thread for Chat Bot
const createCustomerThread = async (req, res) => {
    const { companyId, customerId, name, phone, email } = req.body;
    try {
        await customerService.createCustomer(companyId, customerId, name, phone, email);

        const threadId = await findOrCreateThread({
            customerId,
            companyId,
            channel: 'web'
        });
        res.json({ threadId });
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

module.exports = {
    createCustomerThread,
};