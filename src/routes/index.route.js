const { Router } = require('express');
const userRoutes = require('./user.route');
const fileRoutes = require('./files.route');
const chatRoutes = require('./chat.route');

const router = Router();

// Routes
router.use('/user', userRoutes);
router.use('/files', fileRoutes);
router.use('/chat', chatRoutes);

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