const fileModel = require('../models/file.model');
const fs = require('fs/promises');
const crypto = require('crypto');
const path = require('path');
const { createReadStream } = require('fs');

const uploadFile = async (file) => {
    try {
        if (!file) throw new Error('No file provided');

        // Read file and calculate hash
        const fileStream = createReadStream(file.path);
        const hash = crypto.createHash('md5');

        await new Promise((resolve, reject) => {
            fileStream.on('data', chunk => hash.update(chunk));
            fileStream.on('end', resolve);
            fileStream.on('error', reject);
        });

        const fileHash = hash.digest('hex');
        const fileExt = path.extname(file.originalname);
        const newFilename = `${fileHash}${fileExt}`;
        const newPath = path.join('uploads', newFilename);

        // Check for existing file
        const existingFile = await fileModel.findByHash(fileHash);
        if (existingFile) {
            await fs.unlink(file.path);
            return {
                ...existingFile,
                isDuplicate: true,
                message: 'File already exists'
            };
        }

        // Move and store file
        await fs.rename(file.path, newPath);
        const stats = await fs.stat(newPath);

        const fileId = await fileModel.create(
            file.originalname,
            newPath,
            fileHash,
            stats.size
        );

        return {
            fileId,
            path: newPath,
            size: stats.size,
            isDuplicate: false,
            message: 'File uploaded successfully'
        };
    } catch (error) {
        // Cleanup if error occurs
        if (file?.path) {
            await fs.unlink(file.path).catch(() => { });
        }
        throw error;
    }
};

const cleanupOrphanedFiles = async () => {
    try {
        const dbFiles = await fileModel.getAllPaths();
        const uploadDir = path.join(process.cwd(), 'uploads');

        await fs.access(uploadDir).catch(() => fs.mkdir(uploadDir));

        const physicalFiles = await fs.readdir(uploadDir);

        await Promise.all(physicalFiles.map(async file => {
            const fullPath = path.join(uploadDir, file);
            if (!dbFiles.some(dbPath => path.resolve(dbPath) === path.resolve(fullPath))) {
                await fs.unlink(fullPath).catch(console.error);
            }
        }));
    } catch (err) {
        console.error('Cleanup error:', err);
        throw err;
    }
};

module.exports = {
    uploadFile,
    cleanupOrphanedFiles
};