const Gig = require('../models/Gig');

exports.createGig = async (req, res) => {
  try {
    const { title, description, price, category } = req.body;
    const gig = await Gig.create({
      title, description, price, category,
      freelancerId: req.user.id
    });
    res.status(201).json(gig);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAllGigs = async (req, res) => {
  const gigs = await Gig.find({ status: 'active' }).populate('freelancerId', 'name email');
  res.json(gigs);
};

exports.getGigById = async (req, res) => {
  const gig = await Gig.findById(req.params.id).populate('freelancerId', 'name email');
  if (!gig) return res.status(404).json({ error: 'Gig not found' });
  res.json(gig);
};

exports.updateGig = async (req, res) => {
  const gig = await Gig.findById(req.params.id);
  if (!gig) return res.status(404).json({ error: 'Gig not found' });
  if (gig.freelancerId.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Not your gig' });
  }
  Object.assign(gig, req.body);
  await gig.save();
  res.json(gig);
};

exports.deleteGig = async (req, res) => {
  const gig = await Gig.findById(req.params.id);
  if (!gig) return res.status(404).json({ error: 'Gig not found' });
  if (gig.freelancerId.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Not your gig' });
  }
  await gig.deleteOne();
  res.json({ message: 'Gig deleted' });
};