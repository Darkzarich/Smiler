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
  },
  console: {
    level: 'debug',
    handleExceptions: true,
    json: false,
    colorize: true,
  },
};

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(({
      level, message, label, timestamp,
    }) => `${timestamp} [${level}]: ${message}`),
  ),
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
