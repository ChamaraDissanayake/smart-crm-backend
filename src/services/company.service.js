const companyModel = require('../models/company.model');
const { ConflictError, NotFoundError } = require('../utils/errors');
const { v4: uuidv4 } = require('uuid');

const conflictMessage = 'Company name already exists. Please use unique name';
const NotFoundErrorMessage = 'Company not found';

const createCompany = async (data) => {
    const existingCompany = await companyModel.findByName(data.name);
    if (existingCompany) {
        throw new ConflictError(conflictMessage);
    }

    const companyId = uuidv4();
    await companyModel.create({ id: companyId, ...data });

    await companyModel.addMember(data.userId, companyId, 'admin');

    return {
        id: companyId,
        ...data
    };
};

const getCompany = async (id) => {
    const company = await companyModel.findById(id);
    if (!company) {
        throw new NotFoundError(NotFoundErrorMessage);
    }
    return company;
};

const updateDefaultCompany = async (userId, companyId) => {
    const company = await companyModel.findById(companyId);
    if (!company) {
        throw new NotFoundError(NotFoundErrorMessage);
    }

    await companyModel.updateDefaultCompany(userId, companyId);
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

const getSelectedCompanyByUserId = async (userId) => {
    return await companyModel.getSelectedCompanyByUserId(userId);
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

const updateCompanyPlan = async (companyId, planId) => {
    const company = await companyModel.updateCompanyPlan(planId, companyId);
    if (!company) {
        throw new NotFoundError(NotFoundErrorMessage);
    }
    return company;
};

module.exports = {
    createCompany,
    getCompany,
    updateCompany,
    deleteCompany,
    getUserCompanies,
    getSelectedCompanyByUserId,
    addCompanyMember,
    removeCompanyMember,
    getMyRole,
    updateCompanyPlan,
    updateDefaultCompany
};