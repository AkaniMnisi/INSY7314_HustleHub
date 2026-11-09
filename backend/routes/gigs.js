const { generalLimiter } = require('../middleware/rateLimiter');
const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { validateGig } = require('../middleware/validation');
const ctrl = require('../controllers/gigController');

const router = express.Router();
router.use(generalLimiter);


router.get('/', ctrl.getAllGigs);


router.get('/mine', verifyToken, requireRole('freelancer'), ctrl.getMyGigs);


router.get('/:id', ctrl.getGigById);


router.post('/', verifyToken, requireRole('freelancer'), validateGig, ctrl.createGig);


router.put('/:id', verifyToken, requireRole('freelancer'), validateGig, ctrl.updateGig);


router.delete('/:id', verifyToken, requireRole('freelancer'), ctrl.deleteGig);

module.exports = router;