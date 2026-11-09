jest.mock('../models/Transaction', () => ({ find: jest.fn() }));
const Transaction = require('../models/Transaction');
const { getIncome } = require('../controllers/incomeController');

function callController() {
  return new Promise((resolve) => {
    const res = { json: jest.fn((payload) => resolve(payload)), status: jest.fn().mockReturnThis() };
    getIncome({ user: { id: 'freelancer1' }, id: 'request1' }, res);
  });
}

describe('Income dashboard API contract', () => {
  beforeEach(() => jest.clearAllMocks());
  it('recalculates old 15% transactions using the SARS marginal formula', async () => {
    const today = new Date();
    const taxYear = today.getUTCMonth() >= 2 ? today.getUTCFullYear() : today.getUTCFullYear() - 1;
    const entries = [
      { _id: '1', amount: 100000, tax: 15000, createdAt: new Date(Date.UTC(taxYear, 3, 5)), gigId: { title: 'Design' } },
      { _id: '2', amount: 100000, tax: 15000, createdAt: new Date(Date.UTC(taxYear, 4, 5)), gigId: { title: 'Code' } },
    ];
    Transaction.find.mockReturnValue({ populate: () => ({ sort: async () => entries }) });
    const body = await callController();
    expect(body.totalIncome).toBe(200000);
    expect(body.taxOwed).toBe(18180); // R200k at 18% minus R17,820 rebate
    expect(body.netIncome).toBe(181820);
    expect(body.breakdown[0].gigTitle).toBe('Code');
    expect(body.breakdown[0].tax).toBe(18000);
    expect(body.monthly).toHaveLength(12);
  });
});
