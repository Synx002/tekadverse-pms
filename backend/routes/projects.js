const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { auth, authorize } = require('../middleware/auth');

router.get('/', auth, projectController.getAllProjects);
router.get('/:id', auth, projectController.getProjectById);
router.post('/', auth, authorize('manager', 'admin'), projectController.createProject);
router.put('/:id', auth, authorize('manager', 'admin'), projectController.updateProject);
router.delete('/:id', auth, authorize('admin'), projectController.deleteProject);

module.exports = router;