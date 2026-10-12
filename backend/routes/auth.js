const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validateRegister, validateLogin } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

const generateTokens = (user) => {
  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  return { token, refreshToken };
};

router.post('/register', authLimiter, validateRegister, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const role = req.body.role === 'freelancer' ? 'freelancer' : 'client';

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already exists' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashed, role });
    const tokens = generateTokens(user);

    res.status(201).json({
      ...tokens,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});


router.post('/login', authLimiter, validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.role === 'suspended') {
      return res.status(403).json({ error: 'Account suspended' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const tokens = generateTokens(user);
    res.json({
      ...tokens,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});


router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'No refresh token' });
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (user.role === 'suspended') {
      return res.status(403).json({ error: 'Account suspended' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

module.exports = router;