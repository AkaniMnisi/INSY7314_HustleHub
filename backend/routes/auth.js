const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validateRegister, validateLogin } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');
const lockout = require('../utils/lockout');

const router = express.Router();
const COOKIE_NAME = 'hh_refresh';
const REFRESH_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const publicUser = (user) => ({ _id: user._id, name: user.name, email: user.email, role: user.role });

// Refresh cookies are HttpOnly, never returned in JSON or kept in localStorage.
// Lax works on localhost across ports; cross-site deployments require HTTPS +
// REFRESH_COOKIE_SAMESITE=none, plus tightly controlled FRONTEND_URL.
function cookieOptions() {
  const sameSite = (process.env.REFRESH_COOKIE_SAMESITE || 'lax').toLowerCase();
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || sameSite === 'none',
    sameSite: ['strict', 'lax', 'none'].includes(sameSite) ? sameSite : 'lax',
    path: '/api/auth',
    maxAge: REFRESH_LIFETIME_MS,
  };
}

function readRefreshCookie(req) {
  const entry = (req.headers.cookie || '').split(';').map((x) => x.trim())
    .find((x) => x.startsWith(`${COOKIE_NAME}=`));
  if (!entry) return null;
  try { return decodeURIComponent(entry.slice(COOKIE_NAME.length + 1)); }
  catch { return null; }
}

function issueAccessToken(user) {
  return jwt.sign({ id: String(user._id), email: user.email, role: user.role },
    process.env.JWT_SECRET, { expiresIn: '1h' });
}

async function setSession(user, res) {
  const refreshToken = jwt.sign(
    { id: String(user._id), type: 'refresh', jti: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' }
  );
  await User.updateOne({ _id: user._id }, { $set: { refreshTokenHash: hashToken(refreshToken) } });
  res.cookie(COOKIE_NAME, refreshToken, cookieOptions());
  return issueAccessToken(user);
}

// A custom request header is required for cookie-authenticated mutations.
// A hostile site cannot add this header without a successful CORS preflight.
function requireAjaxHeader(req, res, next) {
  if (req.get('x-requested-with') !== 'XMLHttpRequest') {
    return res.status(403).json({ error: 'Request header required' });
  }
  return next();
}

router.post('/register', authLimiter, validateRegister, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const role = req.body.role === 'freelancer' ? 'freelancer' : 'client';
    if (await User.findOne({ email })) {
      logger.warn('auth.register.duplicate', { email: logger.maskEmail(email), requestId: req.id });
      return res.status(409).json({ error: 'Email already exists' });
    }
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 12), role });
    const token = await setSession(user, res);
    logger.info('auth.register.success', { userId: String(user._id), role, requestId: req.id });
    return res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    logger.error('auth.register.error', { error: err.message, requestId: req.id });
    return res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', authLimiter, validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    const meta = { email: logger.maskEmail(email), requestId: req.id };
    if (!user) {
      logger.warn('auth.login.failed', { ...meta, reason: 'invalid_credentials' });
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (user.role === 'suspended') {
      logger.warn('auth.login.blocked', { ...meta, reason: 'suspended' });
      return res.status(403).json({ error: 'Account suspended' });
    }
    if (lockout.isLocked(user)) {
      logger.warn('auth.login.blocked', { ...meta, reason: 'locked' });
      return res.status(423).json({ error: 'Account temporarily locked. Try again later.' });
    }
    if (!await bcrypt.compare(password, user.password)) {
      const result = lockout.onFailure(user);
      await User.updateOne({ _id: user._id }, {
        $set: { failedLoginAttempts: result.failedLoginAttempts, lockUntil: result.lockUntil },
      });
      logger.warn(result.justLocked ? 'auth.account.locked' : 'auth.login.failed', {
        ...meta, reason: 'invalid_credentials', userId: String(user._id),
        failedAttempts: result.failedLoginAttempts,
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (user.failedLoginAttempts || user.lockUntil) {
      await User.updateOne({ _id: user._id }, { $set: lockout.onSuccess() });
    }
    const token = await setSession(user, res);
    logger.info('auth.login.success', { userId: String(user._id), role: user.role, requestId: req.id });
    return res.json({ token, user: publicUser(user) });
  } catch (err) {
    logger.error('auth.login.error', { error: err.message, requestId: req.id });
    return res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/refresh', authLimiter, requireAjaxHeader, async (req, res) => {
  const token = readRefreshCookie(req);
  if (!token) return res.status(401).json({ error: 'No refresh session' });
  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    if (payload.type !== 'refresh' || !payload.jti) throw new Error('Wrong token type');
    const user = await User.findById(payload.id);
    if (!user || user.role === 'suspended' || lockout.isLocked(user)) {
      return res.status(401).json({ error: 'Session not available' });
    }
    // Rotate atomically: reuse of an old refresh cookie fails even in a race.
    const nextRefresh = jwt.sign(
      { id: String(user._id), type: 'refresh', jti: crypto.randomUUID() },
      process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' }
    );
    const changed = await User.updateOne(
      { _id: user._id, refreshTokenHash: hashToken(token) },
      { $set: { refreshTokenHash: hashToken(nextRefresh) } }
    );
    if (changed.modifiedCount !== 1) return res.status(401).json({ error: 'Session expired' });
    res.cookie(COOKIE_NAME, nextRefresh, cookieOptions());
    logger.info('auth.refresh.success', { userId: String(user._id), requestId: req.id });
    return res.json({ token: issueAccessToken(user) });
  } catch (err) {
    logger.warn('auth.refresh.failed', { reason: 'invalid_or_expired', requestId: req.id });
    return res.status(401).json({ error: 'Invalid refresh session' });
  }
});

router.post('/logout', requireAjaxHeader, async (req, res) => {
  const token = readRefreshCookie(req);
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      if (payload.type === 'refresh') {
        await User.updateOne(
          { _id: payload.id, refreshTokenHash: hashToken(token) },
          { $set: { refreshTokenHash: null } }
        );
      }
    } catch (err) { /* Expired or invalid cookie can still be cleared. */ }
  }
  const { maxAge, ...clearOptions } = cookieOptions();
  res.clearCookie(COOKIE_NAME, clearOptions);
  logger.info('auth.logout', { requestId: req.id });
  return res.json({ message: 'Logged out' });
});

module.exports = router;
