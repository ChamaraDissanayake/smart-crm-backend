const userService = require('../services/user.service');

const register = async (req, res) => {
    try {
        const { email, password } = req.body;
        await userService.register(email, password);
        res.status(201).json({ message: 'User created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const token = await userService.login(email, password);
        res.json({ token });
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
};

const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;
        const token = await userService.requestPasswordReset(email);
        res.json({ message: 'Password reset token generated', token });
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        await userService.resetPassword(token, newPassword);
        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

const deleteUserByEmail = async (req, res) => {
    try {
        const { email } = req.body;
        await userService.deleteUserByEmail(email);
        res.json({ message: 'User account deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    register,
    login,
    requestPasswordReset,
    resetPassword,
    deleteUserByEmail
};