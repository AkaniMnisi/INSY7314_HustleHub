const rateLimit = require('express-rate-limit');

const num = (value, fallback) => Number(value) || fallback;
const common = { standardHeaders: true, legacyHeaders: false };

// Login and register. Per IP. Account lockout covers per-account guessing.
exports.authLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  max: num(process.env.AUTH_RATE_LIMIT_MAX, 20),
  message: { error: 'Too many auth attempts, try again in 15 minutes' },
});

// Applied to every /api route.
exports.generalLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  max: num(process.env.GENERAL_RATE_LIMIT_MAX, 300),
  message: { error: 'Too many requests, try again later' },
});

exports.bookingLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  max: num(process.env.BOOKING_RATE_LIMIT_MAX, 20),
  message: { error: 'Too many booking requests' },
});
