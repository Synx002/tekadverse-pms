const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { auth, authorize } = require('../middleware/auth');

router.get('/', auth, taskController.getAllTasks);
router.get('/my-tasks', auth, authorize('artist'), taskController.getMyTasks);
router.get('/overdue', auth, authorize('manager', 'admin'), taskController.getOverdueTasks);
router.get('/:id', auth, taskController.getTaskById);
router.post('/', auth, authorize('manager', 'admin'), taskController.createTask);
router.put('/:id/status', auth, authorize('artist', 'manager', 'admin'), taskController.updateTaskStatus);
router.put('/:id', auth, authorize('manager', 'admin', 'artist'), taskController.updateTask);
router.delete('/:id', auth, authorize('admin', 'manager'), taskController.deleteTask);

module.exports = router;
