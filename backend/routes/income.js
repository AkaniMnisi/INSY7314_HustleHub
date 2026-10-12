const express = require('express');
const router = express.Router();
const { getIncome } = require('../controllers/incomeController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

// GET /api/income — freelancer only
router.get('/', verifyToken, requireRole('freelancer'), getIncome);

module.exports = router;