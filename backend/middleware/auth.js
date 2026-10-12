const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    
    const user = await User.findById(decoded.id).select('role email');
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }
    if (user.role === 'suspended') {
      return res.status(403).json({ error: 'Account suspended' });
    }

    req.user = { id: decoded.id, email: user.email, role: user.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { verifyToken };