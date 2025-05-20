// src/routes/index.route.js

const { Router } = require('express');
const userRoutes = require('./user.route');
const fileRoutes = require('./files.route');
const chatRoutes = require('./chat.route');
const companyRoutes = require('./company.route');
const subscriptionRoutes = require('./subscription.route');
const integrationRoutes = require('./integration.route');
const whatsappnRoutes = require('./whatsapp.route');

const router = Router();

// Routes
router.use('/user', userRoutes);
router.use('/company', companyRoutes);
router.use('/files', fileRoutes);
router.use('/chat', chatRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/integration', integrationRoutes);
router.use('/whatsapp', whatsappnRoutes);

// 404 handler
router.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

module.exports = router;