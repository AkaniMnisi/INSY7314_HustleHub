const Gig = require('../models/Gig');


exports.createGig = async (req, res) => {
  try {
    const { title, description, price, category } = req.body;
    const gig = await Gig.create({
      title,
      description,
      price,
      category,
      freelancerId: req.user.id
    });
    res.status(201).json(gig);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


exports.getAllGigs = async (req, res) => {
  try {
    const gigs = await Gig.find({ status: 'active' }).populate('freelancerId', 'name');
    res.json(gigs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch gigs' });
  }
};


exports.getMyGigs = async (req, res) => {
  try {
    const gigs = await Gig.find({ freelancerId: req.user.id }).populate('freelancerId', 'name');
    res.json(gigs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch your gigs' });
  }
};


exports.getGigById = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id).populate('freelancerId', 'name');
    if (!gig) return res.status(404).json({ error: 'Gig not found' });
    res.json(gig);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch gig' });
  }
};


exports.updateGig = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ error: 'Gig not found' });
    if (gig.freelancerId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not your gig' });
    }

    const allowed = ['title', 'description', 'price', 'category', 'status'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) gig[field] = req.body[field];
    });

    await gig.save();
    res.json(gig);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


exports.deleteGig = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ error: 'Gig not found' });
    if (gig.freelancerId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not your gig' });
    }
    await gig.deleteOne();
    res.json({ message: 'Gig deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete gig' });
  }
};