const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { auth, authorize } = require('../middleware/auth');
const upload = require('../config/multer');

router.get('/', auth, clientController.getAllClients);
router.get('/:id', auth, clientController.getClientById);
router.post('/', auth, authorize('manager', 'admin'), upload.single('logo'), clientController.createClient);
router.put('/:id', auth, authorize('manager', 'admin'), upload.single('logo'), clientController.updateClient);
router.delete('/:id', auth, authorize('admin'), clientController.deleteClient);

module.exports = router;