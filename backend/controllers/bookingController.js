const crypto = require('crypto');
const mongoose = require('mongoose');
const Gig = require('../models/Gig');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');

exports.createBooking = async (req, res, next) => {
  let booking;
  try {
    const { gigId } = req.body || {};
    if (!gigId || !mongoose.isValidObjectId(gigId)) return res.status(400).json({ error: 'A valid gigId is required' });
    const gig = await Gig.findOne({ _id: gigId, status: 'active' });
    if (!gig) return res.status(404).json({ error: 'Active gig not found' });
    if (gig.freelancerId.toString() === req.user.id) return res.status(400).json({ error: 'You cannot book your own gig' });
    const freelancer = await require('../models/User').findById(gig.freelancerId).select('_id isSuspended');
    if (!freelancer || freelancer.isSuspended) return res.status(400).json({ error: 'Freelancer is unavailable' });
    const amount = Number(gig.price.toFixed(2));
    const configuredRate = Number(process.env.TAX_RATE ?? 0.15);
    const taxRate = Number.isFinite(configuredRate) ? Math.min(1, Math.max(0, configuredRate)) : 0.15;
    const tax = Number((amount * taxRate).toFixed(2));
    booking = await Booking.create({ gigId: gig._id, clientId: req.user.id, freelancerId: gig.freelancerId, amount, confirmationCode: `HH-${crypto.randomBytes(5).toString('hex').toUpperCase()}` });
    let transaction;
    try {
      transaction = await Transaction.create({ bookingId: booking._id, gigId: gig._id, clientId: req.user.id, freelancerId: gig.freelancerId, amount, tax, taxRate, status: 'completed' });
    } catch (err) {
      await Booking.deleteOne({ _id: booking._id });
      throw err;
    }
    res.status(201).json({ booking, transaction, confirmation: 'Booking confirmed. This is a simulated transaction; no payment was processed.' });
  } catch (err) { next(err); }
};
exports.getMyBookings = async (req, res, next) => {
  try {
    const filter = req.user.role === 'freelancer' ? { freelancerId: req.user.id } : { clientId: req.user.id };
    const bookings = await Booking.find(filter).populate('gigId', 'title description category').populate('clientId', 'name email').populate('freelancerId', 'name email').sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) { next(err); }
};
exports.getClientBookings = async (req, res, next) => {
  try { res.json(await Booking.find({ clientId: req.user.id }).populate('gigId', 'title price category').populate('freelancerId', 'name').sort({ createdAt: -1 })); }
  catch (err) { next(err); }
};
exports.getFreelancerBookings = async (req, res, next) => {
  try { res.json(await Booking.find({ freelancerId: req.user.id }).populate('gigId', 'title price category').populate('clientId', 'name email').sort({ createdAt: -1 })); }
  catch (err) { next(err); }
};
