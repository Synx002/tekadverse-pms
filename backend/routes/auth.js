const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth, authorize } = require('../middleware/auth');
const { loginValidator, registerValidator, forgotPasswordValidator, resetPasswordValidator } = require('../middleware/authValidator');

router.post('/register', registerValidator, authController.register);
router.post('/login', loginValidator, authController.login);
router.get('/me', auth, authController.getMe);

router.post('/forgot-password', forgotPasswordValidator, authController.forgotPassword);
router.post('/reset-password/:token', resetPasswordValidator, authController.resetPassword);

module.exports = router;