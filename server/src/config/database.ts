import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

// If we are in static mode, disable buffering globally 
// so all queries fail immediately if the DB is disconnected.
if (env.USE_STATIC_PRODUCTS) {
  mongoose.set('bufferCommands', false);
}

export const connectDatabase = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 2000, // Faster timeout
    });
    logger.info(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error);
    throw error;
  }
};
