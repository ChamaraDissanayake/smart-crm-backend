const fileService = require('../services/file.service');
const authenticate = require('../middleware/auth');
const upload = require('../config/upload.config');
const fileModel = require('../models/file.model');
const fs = require('fs/promises');

const uploadFile = [
    authenticate,
    upload.single('file'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const result = await fileService.uploadFile(req.file);
            res.json(result);
        } catch (error) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(413).json({ error: 'File too large (max 50MB)' });
            }
            console.error('Upload error:', error);
            res.status(500).json({
                error: 'File upload failed',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
];

const getFiles = async (req, res) => {
    try {
        const files = await fileModel.getAll();
        res.json(files);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteFile = async (req, res) => {
    try {
        const fileId = req.params.id;
        const filePath = await fileModel.getPath(fileId);

        if (!filePath) {
            return res.status(404).json({ error: 'File not found in database' });
        }

        try {
            await fs.unlink(filePath);
        } catch (err) {
            console.error('Physical file deletion warning:', err.message);
        }

        const deleted = await fileModel.deleteFile(fileId);

        res.json({
            message: 'File deleted successfully',
            deletedId: fileId,
            dbDeleted: deleted,
            fileDeleted: true
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    uploadFile,
    getFiles,
    deleteFile
};