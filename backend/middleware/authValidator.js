const { body } = require('express-validator');
const validate = require('./validator');

const loginValidator = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    validate
];

const registerValidator = [
    body('name')
        .notEmpty()
        .withMessage('Name is required')
        .trim(),
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('role')
        .isIn(['admin', 'manager', 'artist'])
        .withMessage('Invalid role provided'),
    validate
];

const forgotPasswordValidator = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    validate
];

const resetPasswordValidator = [
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    validate
];

module.exports = {
    loginValidator,
    registerValidator,
    forgotPasswordValidator,
    resetPasswordValidator
};
