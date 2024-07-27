const mongoose = require('mongoose');
const logger = require('./src/config/logger');
const config = require('./src/config/config');

module.exports = async () => {
  try {
    if ([1, 2].includes(mongoose.connection.readyState)) {
      return mongoose.connection;
    }

    const mongooseInstance = await mongoose.connect(config.DB_URL, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
    });

    const db = mongooseInstance.connection;

    db.on('error', (error) => {
      logger.error(error);
    });

    db.once('connected', () => {
      logger.info(
        `[pid: ${process.pid}]: Successfully connected to MongoDB database`,
      );
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
};
