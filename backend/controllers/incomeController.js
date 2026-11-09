const Transaction = require('../models/Transaction');
const logger = require('../utils/logger');
const {
  round2, annualTax, incrementalTax, marginalRate, taxFreeThreshold,
  taxYearStart, taxYearEnd, PRIMARY_REBATE,
} = require('../utils/tax');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getMonthlySlots(start) {
  return Array.from({ length: 12 }, (_, index) => {
    const month = new Date(Date.UTC(start.getUTCFullYear(), 2 + index, 1));
    return {
      key: `${month.getUTCFullYear()}-${month.getUTCMonth()}`,
      month: `${MONTHS[month.getUTCMonth()]} ${String(month.getUTCFullYear()).slice(2)}`,
      earned: 0,
      tax: 0,
    };
  });
}

/**
 * Freelancer-only income report. Re-estimate tax from annual cumulative income
 * rather than trusting legacy Transaction.tax entries (previously flat 15%).
 * All output fields used by the existing frontend are retained.
 */
exports.getIncome = async (req, res) => {
  try {
    const start = taxYearStart();
    const end = taxYearEnd();
    const transactions = await Transaction.find({
      freelancerId: req.user.id,
      status: 'completed',
      createdAt: { $gte: start, $lt: end },
    }).populate('gigId', 'title').sort({ createdAt: 1, _id: 1 });

    let earned = 0;
    const monthly = getMonthlySlots(start);
    const entries = transactions.map((transaction) => {
      const amount = Math.max(0, Number(transaction.amount) || 0);
      const estimatedTax = incrementalTax(earned, amount);
      earned += amount;
      const when = new Date(transaction.createdAt);
      const slot = monthly.find((m) => m.key === `${when.getUTCFullYear()}-${when.getUTCMonth()}`);
      if (slot) {
        slot.earned += amount;
        slot.tax += estimatedTax;
      }
      return {
        _id: transaction._id,
        gigTitle: transaction.gigId?.title || 'Gig',
        amount: round2(amount),
        tax: estimatedTax,
        date: transaction.createdAt,
      };
    });

    const totalIncome = round2(earned);
    const taxOwed = annualTax(earned);
    res.json({
      taxYear: {
        label: `${start.getUTCFullYear()}/${String(start.getUTCFullYear() + 1).slice(-2)}`,
        start,
        end,
        ratesUsed: '2026/27',
        ratesRequireReview: start.getUTCFullYear() !== 2026,
      },
      totalIncome,
      taxOwed,
      totalTax: taxOwed,
      netIncome: round2(totalIncome - taxOwed),
      taxRate: earned ? round2(taxOwed / earned * 100) / 100 : 0, // fraction, not percentage
      marginalRate: marginalRate(earned),
      primaryRebate: PRIMARY_REBATE,
      taxFreeThreshold: taxFreeThreshold(),
      transactionCount: transactions.length,
      monthly: monthly.map(({ month, earned: gross, tax }) => ({
        month, earned: round2(gross), tax: round2(tax),
      })),
      breakdown: entries.reverse(),
    });
  } catch (err) {
    logger.error('income.error', { error: err.message, requestId: req.id });
    res.status(500).json({ error: 'Failed to calculate income' });
  }
};
