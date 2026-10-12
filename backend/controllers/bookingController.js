const Booking = require('../models/Booking');
const Gig = require('../models/Gig');
const Transaction = require('../models/Transaction');

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

    // Create the booking
    const booking = await Booking.create({
      gigId: gig._id,
      clientId: req.user.id,
      freelancerId: gig.freelancerId,
      amount: gig.price,
      status: 'confirmed',
    });

    // Create the associated transaction
    const taxRate = 0.15;
    const tax = Math.round(gig.price * taxRate * 100) / 100;

    await Transaction.create({
      bookingId: booking._id,
      clientId: req.user.id,
      freelancerId: gig.freelancerId,
      gigId: gig._id,
      amount: gig.price,
      tax,
      status: 'completed',
    });

    const populated = await Booking.findById(booking._id)
      .populate('gigId', 'title price category')
      .populate('freelancerId', 'name')
      .populate('clientId', 'name');

    res.status(201).json({ booking: populated });
  } catch (err) {
    console.error('createBooking error:', err);
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
    console.error('listBookings error:', err);
    res.status(500).json({ error: 'Failed to load bookings' });
  }
};