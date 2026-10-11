const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const router = express.Router();
router.use(verifyToken, requireRole('admin'));

router.get('/users', async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
});

router.get('/transactions', async (req, res) => {
  const txns = await Transaction.find()
    .populate('clientId', 'name email')
    .populate('freelancerId', 'name email');
  res.json(txns);
});

router.put('/users/:id/suspend', async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { role: 'suspended' });
  res.json({ message: 'User suspended' });
});

module.exports = router;