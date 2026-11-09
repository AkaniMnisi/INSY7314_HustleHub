// Runs without a database: these routes never reach MongoDB.
process.env.AUTH_RATE_LIMIT_MAX = '100';
const request = require('supertest');
const app = require('../app');
const { COMMON_PASSWORDS } = require('../middleware/validation');

describe('Security behaviour (no database needed)', () => {
  it('health check works and hides the framework', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('sends security headers', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['strict-transport-security']).toBeDefined();
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('returns JSON 404 for unknown API routes', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Not found');
  });

  it('blocks protected routes without a token', async () => {
    for (const path of ['/api/income', '/api/bookings', '/api/admin/users']) {
      const res = await request(app).get(path);
      expect(res.statusCode).toBe(401);
    }
  });

  it('blocks a disallowed CORS origin', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'http://evil.example');
    expect(res.statusCode).toBe(403);
  });

  it('rejects a password with no special character', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'a@b.com', password: 'Abcdefg123' });
    expect(res.statusCode).toBe(400);
  });

  it('rejects a common password even if it meets the length rule', async () => {
    expect(COMMON_PASSWORDS).toContain('password1!');
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'a@b.com', password: 'Password1!' });
    expect(res.statusCode).toBe(400);
  });

  it('rejects NoSQL operators in the login email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: { $gt: '' }, password: 'x' });
    expect(res.statusCode).toBe(400);
  });
});
