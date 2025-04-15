const companyModel = require('../models/company.model');
const { ConflictError, NotFoundError } = require('../utils/errors');

const createCompany = async (companyData, userId) => {
    const existingCompany = await companyModel.findByName(companyData.name);
    if (existingCompany) {
        throw new ConflictError('Company name already exists');
    }

    const companyId = await companyModel.create(companyData);
    await companyModel.addMember(userId, companyId, 'admin');

    return {
        id: companyId,
        ...companyData
    };
};

const getCompany = async (id) => {
    const company = await companyModel.findById(id);
    if (!company) {
        throw new NotFoundError('Company not found');
    }
    return company;
};

const updateCompany = async (id, updateData) => {
    if (updateData.name) {
        const existingCompany = await companyModel.findByName(updateData.name);
        if (existingCompany && existingCompany.id !== id) {
            throw new ConflictError('Company name already exists');
        }
    }

    const updated = await companyModel.update(id, updateData);
    if (!updated) {
        throw new NotFoundError('Company not found');
    }
    return { id, ...updateData };
};

const deleteCompany = async (id) => {
    const company = await companyModel.findById(id);
    if (!company) {
        throw new NotFoundError('Company not found');
    }
    await companyModel.softDelete(id);
};

const getUserCompanies = async (userId) => {
    return await companyModel.findByUserId(userId);
};

const addCompanyMember = async (companyId, userId, role) => {
    const company = await companyModel.findById(companyId);
    if (!company) {
        throw new NotFoundError('Company not found');
    }
    await companyModel.addMember(userId, companyId, role);
};

const removeCompanyMember = async (companyId, userId) => {
    const company = await companyModel.findById(companyId);
    if (!company) {
        throw new NotFoundError('Company not found');
    }
    await companyModel.removeMember(userId, companyId);
};

const getMyRole = async (companyId, userId) => {
    const company = await companyModel.findById(companyId);
    if (!company) {
        throw new NotFoundError('Company not found');
    }
    return await companyModel.getUserRole(userId, companyId);
};

module.exports = {
    createCompany,
    getCompany,
    updateCompany,
    deleteCompany,
    getUserCompanies,
    addCompanyMember,
    removeCompanyMember,
    getMyRole
};