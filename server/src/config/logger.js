/// @ts-check

const winston = require('winston');
const { IS_PRODUCTION, IS_JEST } = require('./config');

const currentDir = process.cwd();

const errorFileTransport = new winston.transports.File({
  level: 'error', // max logging level a transport will log
  filename: `${currentDir}/logs/error.log`,
  handleExceptions: true,
  maxsize: 1024 * 1024 * 10, // 10MB
  maxFiles: 10,
});

const combinedFileTransport = new winston.transports.File({
  level: 'info',
  filename: `${currentDir}/logs/combined.log`,
  handleExceptions: true,
  maxsize: 1024 * 1024 * 10, // 10MB
  maxFiles: 10,
});

const consoleTransport = new winston.transports.Console({
  level: 'debug',
  handleExceptions: true,
  silent: IS_PRODUCTION,
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.cli(),
  ),
});

const logger = winston.createLogger({
  silent: IS_JEST,
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [consoleTransport, errorFileTransport, combinedFileTransport],
  exitOnError: false, // Do not exit on handled exceptions
  defaultMeta: {
    pid: process.pid,
  },
});

module.exports = logger;
