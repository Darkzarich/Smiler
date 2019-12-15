const winston = require('winston');
const appRoot = require('app-root-path');

const options = {
  file: {
    level: 'info',
    filename: `${appRoot}/logs/app.log`,
    handleExceptions: true,
    json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: false,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(({
        level, message, timestamp,
      }) => `${timestamp} [${level}]: ${message}`),
    ),
  },
  console: {
    level: 'debug',
    handleExceptions: true,
    json: false,
    colorize: true,
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp(),
      winston.format.printf(({
        level, message, timestamp,
      }) => `${timestamp} [${level}]: ${message}`),
    ),
  },
};

const logger = winston.createLogger({
  transports: [
    new winston.transports.File(options.file),
    new winston.transports.Console(options.console),
  ],
  exitOnError: false, // do not exit on handled exceptions
});

logger.error = (err, errObj = null) => {
  if (errObj instanceof Error) {
    logger.log({ level: 'error', message: `${err} ${errObj.stack || errObj}` });
  } else {
    logger.log({ level: 'error', message: err });
  }
};

logger.stream = {
  write(message, encoding) {
    logger.info(message);
  },
};

module.exports = logger;
