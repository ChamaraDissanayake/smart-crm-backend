const companyModel = require('../models/company.model');
const { ConflictError, NotFoundError } = require('../utils/errors');

const conflictMessage = 'Company name already exists. Please use unique name';
const NotFoundErrorMessage = 'Company not found';

const createCompany = async (companyData, userId) => {
    const existingCompany = await companyModel.findByName(companyData.name);
    if (existingCompany) {
        throw new ConflictError(conflictMessage);
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
        throw new NotFoundError(NotFoundErrorMessage);
    }
    return company;
};

const updateCompany = async (id, updateData) => {
    if (updateData.name) {
        const existingCompany = await companyModel.findByName(updateData.name);
        if (existingCompany && existingCompany.id !== id) {
            throw new ConflictError(conflictMessage);
        }
    }

    const updated = await companyModel.update(id, updateData);
    if (!updated) {
        throw new NotFoundError(NotFoundErrorMessage);
    }
    return { id, ...updateData };
};

const deleteCompany = async (id) => {
    const company = await companyModel.findById(id);
    if (!company) {
        throw new NotFoundError(NotFoundErrorMessage);
    }
    await companyModel.softDelete(id);
};

const getUserCompanies = async (userId) => {
    return await companyModel.findByUserId(userId);
};

const addCompanyMember = async (companyId, userId, role) => {
    const company = await companyModel.findById(companyId);
    if (!company) {
        throw new NotFoundError(NotFoundErrorMessage);
    }
    await companyModel.addMember(userId, companyId, role);
};

const removeCompanyMember = async (companyId, userId) => {
    const company = await companyModel.findById(companyId);
    if (!company) {
        throw new NotFoundError(NotFoundErrorMessage);
    }
    await companyModel.removeMember(userId, companyId);
};

const getMyRole = async (companyId, userId) => {
    const company = await companyModel.findById(companyId);
    if (!company) {
        throw new NotFoundError(NotFoundErrorMessage);
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