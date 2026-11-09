/**
 * Creates the first admin account.
 *
 * The email and password come from environment variables.
 * Nothing is hard-coded and the password is never printed.
 *
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='Str0ng#Passphrase' node seedAdmin.js
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ quiet: true });
const User = require('./models/User');

(async () => {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';

  if (!email || !password) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD first.');
    process.exit(1);
  }
  if (password.length < 12) {
    console.error('ADMIN_PASSWORD must be at least 12 characters.');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existing = await User.findOne({ email });
    if (existing) {
      console.log('Admin already exists:', email);
    } else {
      await User.create({
        name: 'System Admin',
        email,
        password: await bcrypt.hash(password, 12),
        role: 'admin',
      });
      console.log('Admin created:', email);
    }
    process.exit(0);
  } catch (err) {
    console.error('Seed admin error:', err.message);
    process.exit(1);
  }
})();
