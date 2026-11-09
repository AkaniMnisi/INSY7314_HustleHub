process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-access-key-with-at-least-32-characters';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-key-with-at-least-32-characters';
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');

// Unit/security tests work without a database. Set MONGO_URI to run integration tests.
beforeAll(async () => {
  if (process.env.MONGO_URI && mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  }
}, 30000);

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
});
