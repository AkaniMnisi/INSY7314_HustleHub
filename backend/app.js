const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const gigRoutes = require('./routes/gigs');
const adminRoutes = require('./routes/admin');
const { generalLimiter } = require('./middleware/rateLimiter');

const app = express();

// ─────────────────────────────────────────────────────────
// HTTPS ENFORCEMENT (Production only)
// ─────────────────────────────────────────────────────────
// In production, hosting platforms (Render, Railway, Vercel, Azure)
// terminate SSL at their reverse proxy and forward requests with
// the `x-forwarded-proto` header. This middleware redirects any
// insecure HTTP request to HTTPS.
//
// Locally, NODE_ENV=development, so this is skipped and HTTP works fine.
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(`https://${req.header('host')}${req.url}`);
    }
    next();
  });
}

// Trust the reverse proxy so req.protocol works correctly behind Nginx/Render/etc.
app.set('trust proxy', 1);

// ─────────────────────────────────────────────────────────
// SECURITY HEADERS
// ─────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
    },
  },
  // HSTS: forces browsers to use HTTPS for future requests
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true
  }
}));

// ─────────────────────────────────────────────────────────
// CORS
// ─────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

// ─────────────────────────────────────────────────────────
// BODY PARSING
// ─────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // Limit body size to prevent abuse

// ─────────────────────────────────────────────────────────
// SANITIZATION (Express 5 compatible)
// ─────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const sanitize = require('express-mongo-sanitize').sanitize;
  if (req.body) sanitize(req.body);
  if (req.params) sanitize(req.params);
  next();
});

// ─────────────────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    https: req.secure || req.header('x-forwarded-proto') === 'https',
    env: process.env.NODE_ENV
  });
});

// ─────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────
app.use('/api/auth', generalLimiter, authRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/admin', adminRoutes);

// ─────────────────────────────────────────────────────────
// GLOBAL ERROR HANDLER (must be last)
// ─────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  const message = process.env.NODE_ENV === 'production'
    ? 'An error occurred'
    : err.message;
  res.status(err.status || 500).json({ error: message });
});

module.exports = app;