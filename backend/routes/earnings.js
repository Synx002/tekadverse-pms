const express = require('express');
const router = express.Router();
const earningsController = require('../controllers/earningsController');
const { auth, authorize } = require('../middleware/auth');

router.get('/my-earnings', auth, authorize('artist'), earningsController.getMyEarnings);
router.get('/my-pending-tasks', auth, authorize('artist'), earningsController.getMyPendingTasks);
router.get('/payouts', auth, authorize('manager', 'admin'), earningsController.getPayouts);
router.get('/global-stats', auth, authorize('manager', 'admin'), earningsController.getGlobalStats);
router.get('/spend-analytics', auth, authorize('manager', 'admin'), earningsController.getSpendAnalytics);
router.get('/artist-pending-tasks/:artistId', auth, authorize('manager', 'admin'), earningsController.getArtistPendingTasks);

module.exports = router;

