const { pool } = require('../config/db.config');
const fs = require('fs/promises');  // Added filesystem module

const create = async (id, filename, path, content_hash, size, mimeType) => {
    try {
        const [result] = await pool.query(
            'INSERT INTO files (id, filename, path, content_hash, size, mime_type) VALUES (?, ?, ?, ?, ?, ?)',
            [id, filename, path, content_hash, size, mimeType]
        );
        return result.insertId;
    } catch (error) {
        console.error("Error inserting into database:", error);
        throw error;
    }
};

const findByHash = async (content_hash) => {
    const [rows] = await pool.query(
        'SELECT id, path, size FROM files WHERE content_hash = ?',
        [content_hash]
    );
    return rows[0];
};

const getAll = async () => {
    const [rows] = await pool.query('SELECT * FROM files');
    return rows;
};

const getFileById = async (id) => {
    const [rows] = await pool.query('SELECT * FROM files WHERE id = ?', [id]);
    return rows[0];
};

const deleteFile = async (id) => {
    const file = await this.getPath(id);
    const [result] = await pool.query('DELETE FROM files WHERE id = ?', [id]);

    if (result.affectedRows > 0 && file) {
        await fs.unlink(file).catch(() => { });
    }
    return result.affectedRows > 0;
};

const getPath = async (id) => {
    const [rows] = await pool.query('SELECT path FROM files WHERE id = ?', [id]);
    return rows[0]?.path;
};

const getAllPaths = async () => {
    const [rows] = await pool.query('SELECT path FROM files');
    return rows.map(row => row.path);
};

module.exports = {
    create,
    findByHash,
    getAll,
    getFileById,
    deleteFile,
    getPath,
    getAllPaths
};