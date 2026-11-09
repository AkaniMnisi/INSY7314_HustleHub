const Booking = require('../models/Booking');
const Gig = require('../models/Gig');
const Transaction = require('../models/Transaction');
const logger = require('../utils/logger');
const { incrementalTax, taxYearStart, taxYearEnd } = require('../utils/tax');

/**
 * POST /api/bookings
 * Body: { gigId }
 * Auth: client only
 */
exports.createBooking = async (req, res) => {
  try {
    const { gigId } = req.body;

    if (!gigId) {
      return res.status(400).json({ error: 'gigId is required' });
    }

    const gig = await Gig.findById(gigId);
    if (!gig) {
      return res.status(404).json({ error: 'Gig not found' });
    }

    if (gig.status !== 'active') {
      return res.status(400).json({ error: 'This gig is not currently active' });
    }

    // Prevent freelancers booking their own gigs
    if (String(gig.freelancerId) === String(req.user.id)) {
      return res.status(400).json({ error: 'You cannot book your own gig' });
    }

    // Tax for this booking = extra tax caused by this income, on top of what
    // the freelancer already earned this tax year (see utils/tax.js).
    const earnedSoFar = await Transaction.aggregate([
      {
        $match: {
          freelancerId: gig.freelancerId,
          status: 'completed',
          createdAt: { $gte: taxYearStart(), $lt: taxYearEnd() },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const tax = incrementalTax(earnedSoFar[0]?.total || 0, gig.price);

    // Create the booking
    const booking = await Booking.create({
      gigId: gig._id,
      clientId: req.user.id,
      freelancerId: gig.freelancerId,
      amount: gig.price,
      status: 'confirmed',
    });
    logger.info('booking.created', {
      bookingId: String(booking._id),
      gigId: String(gig._id),
      clientId: req.user.id,
      freelancerId: String(gig.freelancerId),
      amount: gig.price,
      requestId: req.id,
    });

    // Create the associated transaction. Undo the booking if this fails.
    let txn;
    try {
      txn = await Transaction.create({
        bookingId: booking._id,
        clientId: req.user.id,
        freelancerId: gig.freelancerId,
        gigId: gig._id,
        amount: gig.price,
        tax,
        status: 'completed',
      });
      logger.info('transaction.recorded', {
        transactionId: String(txn._id),
        bookingId: String(booking._id),
        amount: gig.price,
        tax,
        requestId: req.id,
      });
    } catch (txnErr) {
      await Booking.deleteOne({ _id: booking._id });
      logger.error('transaction.failed', {
        bookingId: String(booking._id),
        error: txnErr.message,
        requestId: req.id,
      });
      throw txnErr;
    }

    const populated = await Booking.findById(booking._id)
      .populate('gigId', 'title price category')
      .populate('freelancerId', 'name')
      .populate('clientId', 'name');

    res.status(201).json({ booking: populated, transaction: txn });
  } catch (err) {
    logger.error('booking.error', { error: err.message, stack: err.stack, requestId: req.id });
    res.status(500).json({ error: 'Failed to create booking' });
  }
};

/**
 * GET /api/bookings
 * Auth: any logged-in user
 * - Clients see bookings they made
 * - Freelancers see bookings on their gigs
 * - Admins see all
 */
exports.listBookings = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === 'client') {
      filter.clientId = req.user.id;
    } else if (req.user.role === 'freelancer') {
      filter.freelancerId = req.user.id;
    }
    // admin: no filter — sees all

    const bookings = await Booking.find(filter)
      .populate('gigId', 'title price category')
      .populate('freelancerId', 'name')
      .populate('clientId', 'name')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    logger.error('booking.list.error', { error: err.message, stack: err.stack, requestId: req.id });
    res.status(500).json({ error: 'Failed to load bookings' });
  }
};
