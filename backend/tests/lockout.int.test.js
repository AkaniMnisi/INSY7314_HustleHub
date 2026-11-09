// Needs MongoDB (MONGO_URI). Proves the lockout works end to end.
process.env.AUTH_RATE_LIMIT_MAX = '100';
const request = require('supertest');
const app = require('../app');

(process.env.MONGO_URI ? describe : describe.skip)('Account lockout (integration)', () => {
  const email = `lock${Date.now()}@t.com`;
  const password = 'Correct#Pass1';

  it('locks the account after 5 wrong passwords, even for the right one', async () => {
    await request(app).post('/api/auth/register').send({ name: 'Lock Test', email, password });

    for (let i = 0; i < 5; i++) {
      const bad = await request(app).post('/api/auth/login').send({ email, password: 'Wrong#Pass9' });
      expect(bad.statusCode).toBe(401);
    }

    const locked = await request(app).post('/api/auth/login').send({ email, password });
    expect(locked.statusCode).toBe(423);
  });
});
