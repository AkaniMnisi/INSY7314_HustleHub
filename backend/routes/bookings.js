const express = require('express');
const router = express.Router();
const { createBooking, listBookings } = require('../controllers/bookingController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { bookingLimiter } = require('../middleware/rateLimiter');

// POST /api/bookings — client only, rate-limited
router.post(
  '/',
  verifyToken,
  requireRole('client'),
  bookingLimiter,
  createBooking
);

// GET /api/bookings — any authenticated user (role-filtered in the controller)
router.get('/', verifyToken, listBookings);

module.exports = router;