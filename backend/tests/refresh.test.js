// No database required: isolate the authentication routes with a mocked User model.
process.env.AUTH_RATE_LIMIT_MAX = '100';
jest.mock('../models/User', () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  updateOne: jest.fn(),
}));
const request = require('supertest');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const app = require('../app');

const account = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Demo Person', email: 'demo@example.test', role: 'freelancer',
  failedLoginAttempts: 0, lockUntil: null,
};

beforeEach(async () => {
  jest.clearAllMocks();
  account.password = await bcrypt.hash('Correct#Pass1', 4);
  User.findOne.mockResolvedValue(account);
  User.findById.mockResolvedValue(account);
  User.updateOne.mockResolvedValue({ acknowledged: true, modifiedCount: 1 });
});

describe('Rotating HttpOnly refresh sessions', () => {
  it('returns only an access token in JSON and writes a HttpOnly cookie', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: account.email, password: 'Correct#Pass1',
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.refreshToken).toBeUndefined();
    expect(res.headers['set-cookie'][0]).toMatch(/hh_refresh=.*HttpOnly/);
    expect(res.headers['set-cookie'][0]).toMatch(/SameSite=Lax/i);
  });

  it('requires the anti-CSRF request header', async () => {
    const res = await request(app).post('/api/auth/refresh');
    expect(res.statusCode).toBe(403);
  });

  it('rotates a valid refresh cookie and responds with a new access token', async () => {
    const login = await request(app).post('/api/auth/login')
      .send({ email: account.email, password: 'Correct#Pass1' });
    const cookie = login.headers['set-cookie'][0].split(';')[0];
    const refreshed = await request(app).post('/api/auth/refresh')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('Cookie', cookie);
    expect(refreshed.statusCode).toBe(200);
    expect(refreshed.body.token).toBeDefined();
    expect(refreshed.headers['set-cookie'][0]).toContain('HttpOnly');
    expect(refreshed.body.refreshToken).toBeUndefined();
    expect(User.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ refreshTokenHash: expect.any(String) }),
      expect.any(Object)
    );
  });

  it('rejects reuse of an already-rotated refresh token', async () => {
    const login = await request(app).post('/api/auth/login')
      .send({ email: account.email, password: 'Correct#Pass1' });
    const cookie = login.headers['set-cookie'][0].split(';')[0];
    User.updateOne.mockResolvedValueOnce({ modifiedCount: 0 });
    const replay = await request(app).post('/api/auth/refresh')
      .set('X-Requested-With', 'XMLHttpRequest').set('Cookie', cookie);
    expect(replay.statusCode).toBe(401);
  });

  it('clears the cookie on logout', async () => {
    const login = await request(app).post('/api/auth/login')
      .send({ email: account.email, password: 'Correct#Pass1' });
    const cookie = login.headers['set-cookie'][0].split(';')[0];
    const logout = await request(app).post('/api/auth/logout')
      .set('X-Requested-With', 'XMLHttpRequest').set('Cookie', cookie);
    expect(logout.statusCode).toBe(200);
    expect(logout.headers['set-cookie'][0]).toContain('hh_refresh=;');
  });
});
