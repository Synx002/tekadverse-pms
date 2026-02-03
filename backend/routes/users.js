const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth, authorize } = require('../middleware/auth');
const upload = require('../config/multer');

router.get('/', auth, authorize('admin', 'manager'), userController.getAllUsers);
router.get('/artists', auth, authorize('manager', 'admin'), userController.getArtists);
router.post('/', auth, authorize('admin'), upload.single('profile_picture'), userController.createUser);
router.put('/:id', auth, upload.single('profile_picture'), userController.updateUser);
router.delete('/:id', auth, authorize('admin'), userController.deleteUser);
router.get('/me', auth, userController.getProfile);
router.post('/upload-profile', auth, upload.single('profile_picture'), userController.uploadProfilePicture);

module.exports = router;