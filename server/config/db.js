const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    // Log error but do NOT exit — let the app serve the frontend even if DB is down
    console.error('❌ MongoDB connection error:', err.message);
    console.warn('⚠️  Server running without DB — API routes will fail until DB is reachable');

    // Retry after 10 seconds instead of crashing
    setTimeout(connectDB, 10000);
  }
};

module.exports = connectDB;
