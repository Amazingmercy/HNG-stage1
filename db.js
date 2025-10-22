// src/config/database.js
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

/**
 * Connect to MongoDB using mongoose
 */
async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection failed:', err);
    throw err;
  }
}

module.exports = { connectDB };