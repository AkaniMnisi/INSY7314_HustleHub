const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = 'admin@hustlehub.dev';
    const password = 'Admin123!';

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
      console.log('Admin created successfully');
      console.log('Email:    ', email);
      console.log('Password: ', password);
    }

    process.exit(0);
  } catch (err) {
    console.error('Seed admin error:', err.message);
    process.exit(1);
  }
})();