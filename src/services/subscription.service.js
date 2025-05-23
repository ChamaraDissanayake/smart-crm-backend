const subscriptionModel = require('../models/subscription.model');
const { v4: uuidv4 } = require('uuid');

const getAllPlans = async () => {
    const plans = await subscriptionModel.getAllPlans();

    return plans.map(plan => ({
        id: plan.id,
        name: plan.name,
        priceMonthly: parseFloat(plan.price_monthly),
        priceYearly: parseFloat(plan.price_yearly),
        description: plan.description
    }));
};

const subscribePlan = async (data) => {
    const id = uuidv4();
    const subscriptionData = { id, ...data };
    return await subscriptionModel.addSubscription(subscriptionData);
}

module.exports = {
    getAllPlans,
    subscribePlan
};