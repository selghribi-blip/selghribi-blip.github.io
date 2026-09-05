'use strict';

const mongoose = require('mongoose');
const logger = require('./logger');

let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set.');
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });

  isConnected = true;
  logger.info(`MongoDB connected: ${mongoose.connection.host}`);
}

module.exports = connectDB;
