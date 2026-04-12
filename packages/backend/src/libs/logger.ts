import winston from 'winston';
import Config from '@config/index';

const currentDir = process.cwd();

const { combine, timestamp, json, errors, cli, printf } = winston.format;

const fileLogsFormat = combine(errors({ stack: true }), timestamp(), json());

function formatConsoleMetadata(meta: Record<string, unknown>): string {
  const printableMeta = Object.fromEntries(
    Object.entries(meta).filter(
      ([key, value]) => key !== 'pid' && value !== undefined,
    ),
  );

  if (!Object.keys(printableMeta).length) {
    return '';
  }

  try {
    return ` ${JSON.stringify(printableMeta)}`;
  } catch {
    return ' [metadata could not be serialized]';
  }
}

const consoleLogsFormat = combine(
  errors({ stack: true }),
  cli(),
  printf(
    ({ level, message, stack, ...meta }) =>
      `${level}: ${String(stack || message)}${formatConsoleMetadata(meta)}`,
  ),
);

const errorFileTransport = new winston.transports.File({
  silent: Config.IS_JEST,
  level: 'error', // max logging level a transport will log
  format: fileLogsFormat,
  filename: `${currentDir}/logs/error.log`,
  handleExceptions: true,
  maxsize: 1024 * 1024 * 10, // 10MB
  maxFiles: 10,
});

const combinedFileTransport = new winston.transports.File({
  silent: Config.IS_JEST,
  level: 'info',
  format: fileLogsFormat,
  filename: `${currentDir}/logs/combined.log`,
  handleExceptions: true,
  maxsize: 1024 * 1024 * 10, // 10MB
  maxFiles: 10,
});

const consoleTransport = new winston.transports.Console({
  level: Config.IS_JEST || Config.IS_PRODUCTION ? 'error' : 'debug',
  format: consoleLogsFormat,
  handleExceptions: true,
});

export const logger = winston.createLogger({
  transports: [consoleTransport, errorFileTransport, combinedFileTransport],
  exitOnError: false, // Do not exit on handled exceptions
  defaultMeta: {
    pid: process.pid,
  },
});
