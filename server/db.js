const mongoose = require('mongoose');
const logger = require('./src/config/winston');
const config = require('./src/config/config');

mongoose.connect(config.DB_URL, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
});

const db = mongoose.connection;

db.on('error', global.console.error.bind(console, 'connection error:'))
  .once('open', () => {
    logger.info(`${process.pid} [pid]: Successfully connected to MongoDB database`);
  });

module.exports = db;
