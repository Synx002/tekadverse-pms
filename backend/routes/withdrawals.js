const express = require('express');
const router = express.Router();
const withdrawalController = require('../controllers/withdrawalController');
const { auth, authorize } = require('../middleware/auth');

router.post('/request', auth, authorize('artist'), withdrawalController.requestWithdrawal);
router.get('/my', auth, authorize('artist'), withdrawalController.getMyWithdrawals);
router.get('/', auth, authorize('admin', 'manager'), withdrawalController.getAllWithdrawals);
router.put('/:id/status', auth, authorize('admin', 'manager'), withdrawalController.updateWithdrawalStatus);

module.exports = router;
