const request = require('supertest');
const app = require('../app');

(process.env.MONGO_URI ? describe : describe.skip)('Gigs', () => {
  let freelancerToken;

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Freelancer',
      email: `f${Date.now()}-${Math.random()}@t.com`,
      password: 'Test1234!',
      role: 'freelancer'
    });
    console.log('Freelancer setup response:', res.statusCode);
    freelancerToken = res.body.token;
  }, 30000);

  it('creates a gig as freelancer', async () => {
    const res = await request(app)
      .post('/api/gigs')
      .set('Authorization', `Bearer ${freelancerToken}`)
      .send({
        title: 'Test Gig',
        description: 'Test description',
        price: 100,
        category: 'Design'
      });
    console.log('Create gig response:', res.statusCode, res.body);
    expect(res.statusCode).toBe(201);
  }, 30000);

  it('blocks anonymous gig creation', async () => {
    const res = await request(app)
      .post('/api/gigs')
      .send({
        title: 'Anon Gig',
        description: 'Should fail',
        price: 1,
        category: 'Design'
      });
    console.log('Anonymous gig response:', res.statusCode, res.body);
    expect(res.statusCode).toBe(401);
  }, 30000);
});