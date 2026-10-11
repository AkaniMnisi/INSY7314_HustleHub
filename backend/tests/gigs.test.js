const request = require('supertest');
const app = require('../server');

describe('Gigs', () => {
  let token;

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Freelancer', email: `f${Date.now()}@t.com`, password: 'Test1234!', role: 'freelancer'
    });
    token = res.body.token;
  });

  it('creates a gig', async () => {
    const res = await request(app).post('/api/gigs')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Gig', description: 'Desc', price: 100, category: 'Design' });
    expect(res.statusCode).toBe(201);
  });

  it('blocks non-freelancer from creating', async () => {
    const res = await request(app).post('/api/gigs')
      .send({ title: 'X', description: 'Y', price: 1, category: 'Design' });
    expect(res.statusCode).toBe(401);
  });
});