import dotenv from 'dotenv';
import path from 'path';

// Load .env BEFORE any other imports (Clerk reads process.env at import time)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import app from './app';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import { logger } from './utils/logger';
import fs from 'fs';

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', env.LOCAL_UPLOAD_PATH);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const startServer = async () => {
  logger.info(`Starting server... USE_STATIC_PRODUCTS: ${env.USE_STATIC_PRODUCTS}`);
  
  try {
    // Connect to MongoDB
    try {
      await connectDatabase();
      logger.info('✅ MongoDB connected successfully');
    } catch (dbError) {
      if (env.USE_STATIC_PRODUCTS) {
        logger.warn('⚠️ Failed to connect to MongoDB, but continuing because USE_STATIC_PRODUCTS is enabled.');
      } else {
        logger.error('❌ Failed to connect to MongoDB:', dbError);
        throw dbError;
      }
    }

    // Start HTTP server
    app.listen(env.PORT, () => {
      logger.info(`🚀 Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
      logger.info(`📡 API: ${env.SERVER_URL}/api/v1`);
      logger.info(`💊 Health: ${env.SERVER_URL}/health`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    if (!env.USE_STATIC_PRODUCTS) {
      process.exit(1);
    } else {
      logger.info('🔄 Attempting to start server anyway (Static mode)...');
      app.listen(env.PORT, () => {
        logger.info(`🚀 Server running (Static Only) on port ${env.PORT}`);
      });
    }
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

startServer();
