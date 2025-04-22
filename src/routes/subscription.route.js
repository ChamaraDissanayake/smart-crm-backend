const express = require('express');
const {
    getAllSubscriptionPlans,
    subscribePlan
} = require('../controllers/subscription.control');

const authenticate = require('../middleware/auth');
const router = express.Router();

router.get('/', getAllSubscriptionPlans);
router.post('/subscribe', authenticate, subscribePlan);

module.exports = router;