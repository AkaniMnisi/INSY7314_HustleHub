const mongoose = require('mongoose');
const Gig = require('../models/Gig');

exports.getAllGigs = async (req, res, next) => {
  try {
    const filter = { status: 'active' };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.search) filter.$or = [
      { title: { $regex: escapeRegex(String(req.query.search).slice(0, 80)), $options: 'i' } },
      { description: { $regex: escapeRegex(String(req.query.search).slice(0, 80)), $options: 'i' } }
    ];
    const gigs = await Gig.find(filter).populate('freelancerId', 'name').sort({ createdAt: -1 }).limit(100);
    res.json(gigs);
  } catch (err) { next(err); }
};
exports.getGigById = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid gig ID' });
    const gig = await Gig.findOne({ _id: req.params.id, status: 'active' }).populate('freelancerId', 'name');
    if (!gig) return res.status(404).json({ error: 'Gig not found' });
    res.json(gig);
  } catch (err) { next(err); }
};
exports.getMyGigs = async (req, res, next) => {
  try { res.json(await Gig.find({ freelancerId: req.user.id }).sort({ createdAt: -1 })); }
  catch (err) { next(err); }
};
exports.createGig = async (req, res, next) => {
  try {
    const gig = await Gig.create({ title: req.body.title, description: req.body.description, price: req.body.price, category: req.body.category, freelancerId: req.user.id });
    res.status(201).json(gig);
  } catch (err) { next(err); }
};
exports.updateGig = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid gig ID' });
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ error: 'Gig not found' });
    if (gig.freelancerId.toString() !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'You can only modify your own gigs' });
    for (const field of ['title', 'description', 'price', 'category', 'status']) if (req.body[field] !== undefined) gig[field] = req.body[field];
    if (!['active', 'inactive'].includes(gig.status)) return res.status(400).json({ error: 'Invalid gig status' });
    await gig.save(); res.json(gig);
  } catch (err) { next(err); }
};
exports.deleteGig = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid gig ID' });
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ error: 'Gig not found' });
    if (gig.freelancerId.toString() !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'You can only delete your own gigs' });
    const Booking = require('../models/Booking');
    const hasBookings = await Booking.exists({ gigId: gig._id, status: { $ne: 'cancelled' } });
    if (hasBookings) { gig.status = 'inactive'; await gig.save(); return res.json({ message: 'Gig deactivated because it has booking history' }); }
    await gig.deleteOne(); res.json({ message: 'Gig deleted' });
  } catch (err) { next(err); }
};
function escapeRegex(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
