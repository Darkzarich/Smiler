import mongoose from 'mongoose';
import { logger } from './logger.js';
import Config from '../config/index.js';

// Return the connection if it has already been established
async function getDatabase() {
  if (
    [mongoose.STATES.connected, mongoose.STATES.connecting].includes(
      mongoose.connection.readyState,
    )
  ) {
    return mongoose.connection;
  }

  return mongoose.connect(Config.DB_URL, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  });
}

export async function connectDB() {
  try {
    logger.info(`[pid: ${process.pid}] Connecting to MongoDB database...`);

    const dbInstance = await getDatabase();

    const { connection } = dbInstance;

    logger.info(
      `[pid: ${process.pid}] Successfully connected to MongoDB database`,
    );

    connection.on('error', (error) => {
      logger.error(error);
    });

    connection.once('disconnected', () => {
      logger.warn(`[pid: ${process.pid}]: Disconnected from MongoDB database`);
    });

    connection.on('reconnected', () => {
      logger.info(`[pid: ${process.pid}]: Reconnected to MongoDB database`);
    });

    return connection;
  } catch (error) {
    logger.error(error);

    throw error;
  }
}
