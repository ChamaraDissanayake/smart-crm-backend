const { Router } = require('express');
const {
    createCompany,
    getCompany,
    updateCompany,
    deleteCompany,
    getUserCompanies,
    getMyRole,
    addMember,
    removeMember,
    updateCompanyPlan,
    updateDefaultCompany
} = require('../controllers/company.control');

const authenticate = require('../middleware/auth');

const router = Router();

// Company CRUD
router.post('/', authenticate, createCompany);
router.get('/user-companies', authenticate, getUserCompanies);
router.get('/:id', authenticate, getCompany);
router.patch('/:id', authenticate, updateCompany);
router.patch('/update-plan:id', authenticate, updateCompanyPlan);
router.patch('/set-default/:companyId', authenticate, updateDefaultCompany);
router.delete('/:id', authenticate, deleteCompany);

// Membership
router.get('/:id/my-role', authenticate, getMyRole); // For frontend permission checks
router.post('/:id/members', authenticate, addMember); // Basic membership check inside
router.delete('/:id/members/:userId', authenticate, removeMember);

module.exports = router;