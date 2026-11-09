const {
  annualTax,
  incrementalTax,
  marginalRate,
  taxFreeThreshold,
  bracketTax,
  taxYearStart,
  PRIMARY_REBATE,
  BRACKETS,
} = require('../utils/tax');

describe('Tax estimation (2026/27 SARS brackets)', () => {
  it('charges no tax on zero or invalid income', () => {
    expect(annualTax(0)).toBe(0);
    expect(annualTax(-500)).toBe(0);
    expect(annualTax('abc')).toBe(0);
  });

  it('charges no tax below the rebate threshold', () => {
    expect(taxFreeThreshold()).toBe(99000);
    expect(annualTax(99000)).toBe(0);
    expect(annualTax(50000)).toBe(0);
  });

  it('applies 18% then the rebate in the first bracket', () => {
    // 200,000 x 18% = 36,000 - 17,820
    expect(annualTax(200000)).toBe(18180);
  });

  it('is continuous at every bracket edge', () => {
    for (const b of BRACKETS.slice(0, -1)) {
      const atEdge = bracketTax(b.upTo);
      const nextBase = BRACKETS.find((n) => n.from === b.upTo).base;
      expect(Math.round(atEdge)).toBe(nextBase);
    }
  });

  it('calculates a worked example in the 41% bracket', () => {
    // 259,783 + 41% x (1,000,000 - 887,000) - 17,820
    expect(annualTax(1000000)).toBe(288293);
  });

  it('adds up: per-booking tax equals tax on the total', () => {
    const amounts = [150000, 80000, 200000, 90000];
    let earned = 0;
    let sum = 0;
    for (const a of amounts) {
      sum += incrementalTax(earned, a);
      earned += a;
    }
    expect(sum).toBeCloseTo(annualTax(earned), 1);
  });

  it('taxes a booking at the marginal rate once past the threshold', () => {
    // Already earned 300,000 (26% bracket). A R1,000 gig adds R260 tax.
    expect(incrementalTax(300000, 1000)).toBe(260);
  });

  it('reports the marginal rate', () => {
    expect(marginalRate(0)).toBe(0);
    expect(marginalRate(98000)).toBe(0);
    expect(marginalRate(150000)).toBe(0.18);
    expect(marginalRate(300000)).toBe(0.26);
    expect(marginalRate(2000000)).toBe(0.45);
  });

  it('uses 1 March as the start of the tax year', () => {
    expect(taxYearStart(new Date('2026-11-09T10:00:00Z')).toISOString()).toBe('2026-03-01T00:00:00.000Z');
    expect(taxYearStart(new Date('2027-02-28T10:00:00Z')).toISOString()).toBe('2026-03-01T00:00:00.000Z');
    expect(taxYearStart(new Date('2027-03-01T00:00:00Z')).toISOString()).toBe('2027-03-01T00:00:00.000Z');
  });

  it('exposes the rebate used', () => {
    expect(PRIMARY_REBATE).toBe(17820);
  });
});
