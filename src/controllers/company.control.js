const companyService = require('../services/company.service');

const createCompany = async (req, res) => {
    try {
        const company = await companyService.createCompany(req.body);
        res.status(201).json(company);
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

const getCompany = async (req, res) => {
    try {
        const company = await companyService.getCompany(req.params.id);
        res.json(company);
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

const updateCompany = async (req, res) => {
    try {
        const company = await companyService.updateCompany(req.params.id, req.body);
        res.json(company);
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

const deleteCompany = async (req, res) => {
    try {
        await companyService.deleteCompany(req.params.id);
        res.json({ message: 'Company deleted successfully' });
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

const getUserCompanies = async (req, res) => {
    try {
        const companies = await companyService.getUserCompanies(req.user.id);
        res.json(companies);
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

const addMember = async (req, res) => {
    try {
        await companyService.addCompanyMember(
            req.params.id,
            req.body.userId,
            req.body.role
        );
        res.json({ message: 'Member added successfully' });
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

const removeMember = async (req, res) => {
    try {
        await companyService.removeCompanyMember(
            req.params.id,
            req.params.userId
        );
        res.json({ message: 'Member removed successfully' });
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

const getMyRole = async (req, res) => {
    try {
        const role = await companyService.getMyRole(req.params.id, req.user.id);
        res.json({ role });
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

module.exports = {
    createCompany,
    getCompany,
    updateCompany,
    deleteCompany,
    getUserCompanies,
    addMember,
    removeMember,
    getMyRole
};