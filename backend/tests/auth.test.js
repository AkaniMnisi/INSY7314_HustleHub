const request = require('supertest');
const app = require('../server');

describe('Auth', () => {
  it('registers a user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test', email: `t${Date.now()}@t.com`, password: 'Test1234!', role: 'client'
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.token).toBeDefined();
  });

  it('rejects weak password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test', email: 'weak@t.com', password: '123'
    });
    expect(res.statusCode).toBe(400);
  });
});