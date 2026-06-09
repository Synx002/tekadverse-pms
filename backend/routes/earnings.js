const express = require('express');
const router = express.Router();
const earningsController = require('../controllers/earningsController');
const { auth, authorize } = require('../middleware/auth');

router.get('/my-earnings', auth, authorize('artist'), earningsController.getMyEarnings);
router.get('/payouts', auth, authorize('manager', 'admin'), earningsController.getPayouts);

module.exports = router;
