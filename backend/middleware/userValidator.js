const { body } = require('express-validator');
const validate = require('./validator');

const createUserValidator = [
    body('name').notEmpty().withMessage('Name is required').trim(),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['admin', 'manager', 'artist']).withMessage('Invalid role'),
    validate
];

const updateUserValidator = [
    body('name').optional().notEmpty().withMessage('Name cannot be empty').trim(),
    body('email').optional().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['admin', 'manager', 'artist']).withMessage('Invalid role'),
    validate
];

module.exports = {
    createUserValidator,
    updateUserValidator
};
