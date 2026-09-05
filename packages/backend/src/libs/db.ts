import mongoose from 'mongoose';
import Config from '@config/index';
import { logger } from '@libs/logger';

// Return the connection if it has already been established
async function getDatabase() {
  if (
    [mongoose.STATES.connected, mongoose.STATES.connecting].includes(
      mongoose.connection.readyState,
    )
  ) {
    return mongoose;
  }

  return mongoose.connect(Config.DB_URL);
}

export async function connectDB() {
  try {
    logger.info('db_connecting');

    const dbInstance = await getDatabase();

    const { connection } = dbInstance;

    logger.info('db_connected');

    connection.on('error', (error) => {
      logger.error('db_connection_error', { error });
    });

    connection.once('disconnected', () => {
      logger.warn('db_disconnected');
    });

    connection.on('reconnected', () => {
      logger.info('db_reconnected');
    });

    return connection;
  } catch (error) {
    logger.error('db_initial_connection_failed', { error });

    throw error;
  }
}
