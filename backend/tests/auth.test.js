const request = require('supertest');
const app = require('../app');

(process.env.MONGO_URI ? describe : describe.skip)('Auth', () => {
  it('registers a user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: `t${Date.now()}-${Math.random()}@t.com`,
      password: 'Test1234!',
      role: 'client'
    });
    console.log('Register response:', res.statusCode, res.body);
    expect(res.statusCode).toBe(201);
    expect(res.body.token).toBeDefined();
  }, 30000);

  it('rejects weak password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test',
      email: `w${Date.now()}-${Math.random()}@t.com`,
      password: '123'
    });
    console.log('Weak password response:', res.statusCode, res.body);
    expect(res.statusCode).toBe(400);
  }, 30000);

  it('forces admin role to client', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Hacker',
      email: `h${Date.now()}-${Math.random()}@t.com`,
      password: 'Test1234!',
      role: 'admin'
    });
    console.log('Admin role attempt response:', res.statusCode, res.body);
    expect(res.statusCode).toBe(201);
    expect(res.body.user.role).not.toBe('admin');
  }, 30000);
});