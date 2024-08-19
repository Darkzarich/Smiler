const winston = require('winston');

const { IS_PRODUCTION, IS_JEST } = require('../config/config');

const currentDir = process.cwd();

const { combine, timestamp, json, errors, cli } = winston.format;

const fileLogsFormat = combine(errors({ stack: true }), timestamp(), json());

const errorFileTransport = new winston.transports.File({
  silent: IS_JEST,
  level: 'error', // max logging level a transport will log
  format: fileLogsFormat,
  filename: `${currentDir}/logs/error.log`,
  handleExceptions: true,
  maxsize: 1024 * 1024 * 10, // 10MB
  maxFiles: 10,
});

const combinedFileTransport = new winston.transports.File({
  silent: IS_JEST,
  level: 'info',
  format: fileLogsFormat,
  filename: `${currentDir}/logs/combined.log`,
  handleExceptions: true,
  maxsize: 1024 * 1024 * 10, // 10MB
  maxFiles: 10,
});

const consoleTransport = new winston.transports.Console({
  level: IS_JEST || IS_PRODUCTION ? 'error' : 'debug',
  format: combine(errors({ stack: true }), cli()),
  handleExceptions: true,
});

module.exports.logger = winston.createLogger({
  transports: [consoleTransport, errorFileTransport, combinedFileTransport],
  exitOnError: false, // Do not exit on handled exceptions
  defaultMeta: {
    pid: process.pid,
  },
});
