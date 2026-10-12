const Transaction = require('../models/Transaction');

const TAX_RATE = 0.15;

/**
 * GET /api/income
 * Auth: freelancer only
 * Returns totals + per-transaction breakdown for the logged-in freelancer.
 */
exports.getIncome = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      freelancerId: req.user.id,
      status: 'completed',
    })
      .populate('gigId', 'title')
      .sort({ createdAt: -1 });

    const totalIncome = transactions.reduce(
      (sum, t) => sum + (Number(t.amount) || 0),
      0
    );
    const taxOwed = transactions.reduce(
      (sum, t) => sum + (Number(t.tax) || 0),
      0
    );
    const netIncome = totalIncome - taxOwed;

    const breakdown = transactions.map((t) => ({
      _id: t._id,
      gigTitle: t.gigId?.title || 'Gig',
      amount: t.amount,
      tax: t.tax,
      date: t.createdAt,
    }));

    res.json({
      totalIncome: Math.round(totalIncome * 100) / 100,
      taxRate: TAX_RATE,
      taxOwed: Math.round(taxOwed * 100) / 100,
      netIncome: Math.round(netIncome * 100) / 100,
      transactionCount: transactions.length,
      breakdown,
    });
  } catch (err) {
    console.error('getIncome error:', err);
    res.status(500).json({ error: 'Failed to calculate income' });
  }
};