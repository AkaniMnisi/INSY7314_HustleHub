const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const gigRoutes = require('./routes/gigs');
const adminRoutes = require('./routes/admin');
const bookingRoutes = require('./routes/bookings');
const incomeRoutes = require('./routes/income');
const { generalLimiter } = require('./middleware/rateLimiter');

const app = express();

app.set('trust proxy', 1);

if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(`https://${req.header('host')}${req.url}`);
    }
    next();
  });
}

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// ----- CORS -----
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10kb' }));

app.use((req, res, next) => {
  const sanitize = require('express-mongo-sanitize').sanitize;
  if (req.body) sanitize(req.body);
  if (req.params) sanitize(req.params);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    https: req.secure || req.header('x-forwarded-proto') === 'https',
    env: process.env.NODE_ENV,
  });
});

// ----- Routes -----
app.use('/api/auth', generalLimiter, authRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/income', incomeRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  const message = process.env.NODE_ENV === 'production'
    ? 'An error occurred'
    : err.message;
  res.status(err.status || 500).json({ error: message });
});

module.exports = app;np