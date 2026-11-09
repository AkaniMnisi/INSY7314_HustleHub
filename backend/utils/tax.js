/**
 * Tax estimation for freelancers.
 *
 * This is an ESTIMATE for the assessment. It is not tax advice.
 *
 * Method:
 *  1. Take the income a freelancer earned on HustleHub+ in the current
 *     South African tax year (1 March to end of February).
 *  2. Treat it as taxable income. No deductions are applied.
 *  3. Apply the SARS individual brackets (progressive rates).
 *  4. Subtract the primary rebate. Tax cannot go below zero.
 *
 * Each booking is taxed at the MARGINAL rate on top of the income already
 * earned that tax year. So the tax stored per transaction always adds up
 * to the tax on the year's total income.
 *
 * Source: SARS "Rates of tax for individuals", 2026/27 tax year.
 * Brackets and rebate must be re-checked each March.
 */

const TAX_YEAR_LABEL = '2026/27';
const PRIMARY_REBATE = 17820;

// `base` is the tax at the start of the bracket (`from`).
const BRACKETS = [
  { from: 0,       upTo: 245100,   base: 0,      rate: 0.18 },
  { from: 245100,  upTo: 383100,   base: 44118,  rate: 0.26 },
  { from: 383100,  upTo: 530200,   base: 79998,  rate: 0.31 },
  { from: 530200,  upTo: 695800,   base: 125599, rate: 0.36 },
  { from: 695800,  upTo: 887000,   base: 185215, rate: 0.39 },
  { from: 887000,  upTo: 1878600,  base: 259783, rate: 0.41 },
  { from: 1878600, upTo: Infinity, base: 666339, rate: 0.45 },
];

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

function toIncome(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Tax from the brackets only, before the rebate. */
function bracketTax(income) {
  const x = toIncome(income);
  const b = BRACKETS.find((br) => x <= br.upTo) || BRACKETS[BRACKETS.length - 1];
  return b.base + (x - b.from) * b.rate;
}

/** Annual tax after the primary rebate. Never negative. */
function annualTax(income) {
  return round2(Math.max(0, bracketTax(income) - PRIMARY_REBATE));
}

/** Extra tax caused by earning `amount` on top of `priorIncome`. */
function incrementalTax(priorIncome, amount) {
  const prior = toIncome(priorIncome);
  const add = toIncome(amount);
  return round2(annualTax(prior + add) - annualTax(prior));
}

/** Marginal rate that applies to the next rand earned. 0 under the threshold. */
function marginalRate(income) {
  const x = toIncome(income);
  if (x < taxFreeThreshold()) return 0;
  const b = BRACKETS.find((br) => x < br.upTo) || BRACKETS[BRACKETS.length - 1];
  return b.rate;
}

/** Income below which no tax is payable (rebate wipes out the tax). */
function taxFreeThreshold() {
  return PRIMARY_REBATE / BRACKETS[0].rate;
}

/** Start of the SA tax year that contains `date` (1 March, UTC). */
function taxYearStart(date = new Date()) {
  const d = new Date(date);
  const year = d.getUTCMonth() >= 2 ? d.getUTCFullYear() : d.getUTCFullYear() - 1;
  return new Date(Date.UTC(year, 2, 1));
}

/** First moment after the tax year (1 March next year, UTC). */
function taxYearEnd(date = new Date()) {
  const start = taxYearStart(date);
  return new Date(Date.UTC(start.getUTCFullYear() + 1, 2, 1));
}

module.exports = {
  TAX_YEAR_LABEL,
  PRIMARY_REBATE,
  BRACKETS,
  round2,
  bracketTax,
  annualTax,
  incrementalTax,
  marginalRate,
  taxFreeThreshold,
  taxYearStart,
  taxYearEnd,
};
