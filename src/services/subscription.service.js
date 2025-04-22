const subscriptionModel = require('../models/subscription.model');

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
    return await subscriptionModel.addSubscription(data);
}

module.exports = {
    getAllPlans,
    subscribePlan
};