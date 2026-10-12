const Transaction = require('../models/Transaction');
exports.getIncome = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ freelancerId: req.user.id, status: 'completed' }).populate('gigId', 'title category').populate('clientId', 'name').sort({ createdAt: -1 });
    const totalIncome = Number(transactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2));
    const totalTax = Number(transactions.reduce((sum, t) => sum + t.tax, 0).toFixed(2));
    const configuredRate = Number(process.env.TAX_RATE ?? 0.15);
    const taxRate = Number.isFinite(configuredRate) ? Math.min(1, Math.max(0, configuredRate)) : 0.15;
    res.json({ totalIncome, totalTax, netIncome: Number((totalIncome - totalTax).toFixed(2)), transactionCount: transactions.length, taxRate, transactions, note: 'Tax is a configurable illustrative assessment estimate, not professional tax advice.' });
  } catch (err) { next(err); }
};
