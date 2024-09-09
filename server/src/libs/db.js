import mongoose from 'mongoose';
import { logger } from './logger.js';
import Config from '../config/index.js';

export async function connectDB() {
  try {
    // Return the connection if it has already been established
    if ([1, 2].includes(mongoose.connection.readyState)) {
      return mongoose.connection;
    }

    const mongooseInstance = await mongoose.connect(Config.DB_URL, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
    });

    const db = mongooseInstance.connection;

    logger.info(
      `[pid: ${process.pid}] Successfully connected to MongoDB database`,
    );

    db.on('error', (error) => {
      logger.error(error);
    });

    db.once('disconnected', () => {
      logger.warn(`[pid: ${process.pid}]: Disconnected from MongoDB database`);
    });

    db.on('reconnected', () => {
      logger.info(`[pid: ${process.pid}]: Reconnected to MongoDB database`);
    });

    return db;
  } catch (error) {
    logger.error(error);
  }
}
