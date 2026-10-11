const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const ctrl = require('../controllers/gigController');

const router = express.Router();

router.get('/', ctrl.getAllGigs);
router.get('/:id', ctrl.getGigById);
router.post('/', verifyToken, requireRole('freelancer'), ctrl.createGig);
router.put('/:id', verifyToken, requireRole('freelancer'), ctrl.updateGig);
router.delete('/:id', verifyToken, requireRole('freelancer'), ctrl.deleteGig);

module.exports = router;