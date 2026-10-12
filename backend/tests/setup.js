require('dotenv').config();
const mongoose = require('mongoose');


beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
  }
}, 30000); 


afterAll(async () => {
  await mongoose.connection.close();
});