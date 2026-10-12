const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { getIncome } = require('../controllers/incomeController');

const router = express.Router();

router.get(
    '/',
    verifyToken,
    requireRole('freelancer'),
    getIncome
);

module.exports = router;