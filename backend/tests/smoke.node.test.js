// Set test-only secrets before importing routes. This script never uses .env/MongoDB.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-access-key-with-at-least-32-characters';
process.env.JWT_REFRESH_SECRET = 'test-refresh-key-with-at-least-32-characters';
// Fast smoke/regression tests. Uses in-memory mocks (NO MongoDB required).
// Run with: npm run test:smoke
const { test } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const request = require('supertest');
const User = require('../models/User');
const app = require('../app');
const { annualTax, incrementalTax, taxYearStart } = require('../utils/tax');

// Protect against accidentally connecting to a real database during this test.
const account = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Test User', email: 'node-smoke@example.test', role: 'freelancer',
  failedLoginAttempts: 0, lockUntil: null, refreshTokenHash: null,
};
User.findOne = async ({ email }) => email === account.email ? account : null;
User.findById = async (id) => String(id) === account._id ? account : null;
User.updateOne = async (query, change) => {
  if (String(query._id) !== account._id) return { modifiedCount: 0 };
  if ('refreshTokenHash' in query && query.refreshTokenHash !== account.refreshTokenHash) {
    return { modifiedCount: 0 };
  }
  Object.assign(account, change.$set);
  return { modifiedCount: 1 };
};

const login = (password) => request(app).post('/api/auth/login')
  .send({ email: account.email, password });
const cookie = (res) => res.headers['set-cookie'][0].split(';')[0];
const authenticatedCookiePost = (path, value) => request(app).post(path)
  .set('X-Requested-With', 'XMLHttpRequest').set('Cookie', value);

test('tax rates/health and headers', async () => {
  assert.equal(annualTax(200000), 18180);
  assert.equal(incrementalTax(300000, 1000), 260);
  assert.equal(taxYearStart(new Date('2026-11-09')).toISOString(), '2026-03-01T00:00:00.000Z');
  const response = await request(app).get('/api/health');
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.ok(response.headers['content-security-policy']);
  assert.equal(response.headers['x-powered-by'], undefined);
  assert.equal((await request(app).get('/api/health').set('Origin','http://bad.example')).statusCode, 403);
  assert.equal((await request(app).post('/api/auth/login')
    .send({ email: { $gt: '' }, password: 'bad' })).statusCode, 400);
});

test('access token, HttpOnly refresh cookie, rotation, replay prevention, logout', async () => {
  account.password = await bcrypt.hash('Correct#Pass1', 4);
  const res = await login('Correct#Pass1');
  assert.equal(res.statusCode, 200);
  assert.ok(res.body.token);
  assert.equal(res.body.refreshToken, undefined);
  assert.match(res.headers['set-cookie'][0], /HttpOnly/);
  assert.match(res.headers['set-cookie'][0], /SameSite=Lax/);
  const oldCookie = cookie(res);
  assert.equal((await request(app).post('/api/auth/refresh').set('Cookie', oldCookie)).statusCode, 403);
  const renewed = await authenticatedCookiePost('/api/auth/refresh', oldCookie);
  assert.equal(renewed.statusCode, 200);
  assert.ok(renewed.body.token);
  assert.notEqual(cookie(renewed), oldCookie);
  assert.equal((await authenticatedCookiePost('/api/auth/refresh', oldCookie)).statusCode, 401);
  const loggedOut = await authenticatedCookiePost('/api/auth/logout', cookie(renewed));
  assert.equal(loggedOut.statusCode, 200);
  assert.match(loggedOut.headers['set-cookie'][0], /hh_refresh=;/);
  assert.equal((await authenticatedCookiePost('/api/auth/refresh',cookie(renewed))).statusCode,401);
});

test('five bad passwords lock the account, including correct password', async () => {
  account.failedLoginAttempts = 0;
  account.lockUntil = null;
  account.password = await bcrypt.hash('Correct#Pass1', 4);
  for (let index=0;index<5;index++) {
    const response = await login('Wrong#Pass9');
    assert.equal(response.statusCode, 401);
  }
  assert.equal((await login('Correct#Pass1')).statusCode, 423);
});

test('income response re-estimates legacy transaction tax and retains fields for frontend', async () => {
  const Transaction = require('../models/Transaction');
  const { getIncome } = require('../controllers/incomeController');
  const startYear = new Date().getUTCMonth() >= 2
    ? new Date().getUTCFullYear() : new Date().getUTCFullYear() - 1;
  const records = [
    { _id: 'txn1', amount: 100000, tax: 15000, createdAt: new Date(Date.UTC(startYear, 3, 5)), gigId: { title: 'Design' } },
    { _id: 'txn2', amount: 100000, tax: 15000, createdAt: new Date(Date.UTC(startYear, 4, 5)), gigId: { title: 'Web' } },
  ];
  Transaction.find = () => ({ populate: () => ({ sort: async () => records }) });
  const result = await new Promise((resolve, reject) => getIncome(
    { user: { id: account._id }, id: 'smoke-tax' },
    { json: resolve, status: () => ({ json: reject }) }
  ));
  assert.equal(result.totalIncome, 200000);
  assert.equal(result.taxOwed, 18180);
  assert.equal(result.netIncome, 181820);
  assert.equal(result.taxRate, 0.0909);
  assert.equal(result.breakdown[0].tax, 18000);
  assert.equal(result.monthly.length, 12);
  assert.equal(result.taxYear.ratesUsed, '2026/27');
});
