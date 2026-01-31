const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');
const { auth, authorize } = require('../middleware/auth');

router.get('/', auth, pageController.getAllPages);
router.get('/:id/available-steps', auth, pageController.getAvailableSteps);
router.get('/:id', auth, pageController.getPageById);
router.post('/', auth, authorize('admin', 'manager'), pageController.createPage);
router.put('/:id', auth, authorize('admin', 'manager'), pageController.updatePage);
router.delete('/:id', auth, authorize('admin', 'manager'), pageController.deletePage);

module.exports = router;
