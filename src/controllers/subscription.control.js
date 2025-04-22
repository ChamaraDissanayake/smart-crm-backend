const subscriptionService = require('../services/subscription.service');

const getAllSubscriptionPlans = async (req, res) => {
    try {
        const plans = await subscriptionService.getAllPlans();
        res.status(200).json(plans);
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
}

const subscribePlan = async (req, res) => {
    try {
        const subscribedData = await subscriptionService.subscribePlan(req.body);
        res.status(201).json(subscribedData);
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
}

module.exports = {
    getAllSubscriptionPlans,
    subscribePlan
}