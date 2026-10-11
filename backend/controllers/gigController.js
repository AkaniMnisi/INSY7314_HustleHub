exports.getAllGigs = async (req, res) => {
  const gigs = await Gig.find({ status: 'active' }).populate('freelancerId', 'name');
  res.json(gigs);
};

exports.getGigById = async (req, res) => {
  const gig = await Gig.findById(req.params.id).populate('freelancerId', 'name');
  if (!gig) return res.status(404).json({ error: 'Gig not found' });
  res.json(gig);
};