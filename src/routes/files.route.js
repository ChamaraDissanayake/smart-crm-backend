const { Router } = require('express');
const { uploadFile, getFiles, deleteFile } = require('../controllers/files.control');
const fileService = require('../services/file.service');
const authenticate = require('../middleware/auth.gurd');
const rateLimit = require('express-rate-limit');

const router = Router();

// Rate limiting for file uploads
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 uploads per windowMs
    message: 'Too many upload attempts, please try again later'
});

router.post('/upload', authenticate, uploadLimiter, uploadFile);
router.get('/', authenticate, getFiles);
router.delete('/:id', authenticate, deleteFile);

// Run cleanup on startup with delay
setTimeout(() => {
    fileService.cleanupOrphanedFiles()
        .catch(err => console.error('Initial cleanup failed:', err));
}, 10000);

// Schedule daily cleanup
setInterval(() => {
    fileService.cleanupOrphanedFiles()
        .catch(err => console.error('Scheduled cleanup failed:', err));
}, 24 * 60 * 60 * 1000); // Daily

module.exports = router;