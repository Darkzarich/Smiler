const mongoose = require('mongoose');
const logger = require('./src/config/logger');
const config = require('./src/config/config');

mongoose
  .connect(config.DB_URL, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .catch((error) => {
    logger.error(error);
  });

const db = mongoose.connection;

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

module.exports = db;
