const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { auth } = require('../middleware/auth');

router.get('/task/:task_id', auth, commentController.getCommentsByTask);
router.post('/', auth, commentController.addComment);
router.delete('/:id', auth, commentController.deleteComment);

module.exports = router;