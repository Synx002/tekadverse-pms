const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth, authorize } = require('../middleware/auth');

router.post('/register', auth, authorize('admin'), authController.register);
router.post('/login', authController.login);
router.get('/me', auth, authController.getMe);

module.exports = router;