import cluster from 'node:cluster';
import winston from 'winston';
import Config from '@config/index';

const { combine, timestamp, json, errors, colorize, printf } = winston.format;

type SerializedError = Record<string, unknown>;

/**
 * `JSON.stringify` on an Error yields `{}` — none of its useful properties are
 * enumerable. Anything logged as metadata (`logger.error(msg, { error })`)
 * would therefore reach the transport empty, so Errors are flattened by hand.
 */
function serializeError(error: Error): SerializedError {
  const serialized: SerializedError = {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };

  // Node and MongoDB both hang a `code` off their errors, and it is usually the
  // most specific thing available (ENOENT, 11000, ...)
  if ('code' in error && error.code !== undefined) {
    serialized.code = error.code;
  }

  if (error.cause instanceof Error) {
    serialized.cause = serializeError(error.cause);
  }

  return serialized;
}

/**
 * `errors({ stack: true })` only unwraps an Error passed as the log message
 * itself. This covers the other shape — an Error sitting in the metadata.
 */
const serializeErrorMetadata = winston.format((info) => {
  Object.entries(info).forEach(([key, value]) => {
    if (value instanceof Error) {
      // eslint-disable-next-line security/detect-object-injection, no-param-reassign
      info[key] = serializeError(value);
    }
  });

  return info;
});

const jsonLogsFormat = combine(
  errors({ stack: true }),
  serializeErrorMetadata(),
  timestamp(),
  json(),
);

function formatConsoleMetadata(meta: Record<string, unknown>): string {
  const printableMeta = Object.fromEntries(
    Object.entries(meta).filter(([, value]) => value !== undefined),
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

const prettyLogsFormat = combine(
  errors({ stack: true }),
  serializeErrorMetadata(),
  timestamp({ format: 'HH:mm:ss.SSS' }),
  colorize(),
  printf((info) => {
    const {
      level,
      message,
      stack,
      timestamp: time,
      // Noise in a local terminal: there is one process per terminal, and the
      // structured fields still carry both for the JSON transport.
      pid,
      role,
      ...meta
    } = info;

    // An Error in the metadata is far easier to read as a stack on its own
    // lines than folded into the one-line metadata JSON.
    const metaStacks = Object.entries(meta)
      .filter(
        (entry): entry is [string, SerializedError] =>
          typeof entry[1] === 'object' &&
          entry[1] !== null &&
          typeof (entry[1] as SerializedError).stack === 'string',
      )
      .map(([key, value]) => {
        delete meta[key as keyof typeof meta];

        return `\n${value.stack as string}`;
      })
      .join('');

    return `${time} ${level}: ${String(stack || message)}${formatConsoleMetadata(meta)}${metaStacks}`;
  }),
);

// A single stdout stream, deliberately. The app runs several cluster workers,
// and Winston's file rotation counts bytes per process — pointing every worker
// at one file makes them rename it out from under each other and lose lines.
// Whatever supervises the process (Docker, systemd, a log collector) is the
// thing that can see all the workers at once, so it owns collection and
// rotation. See docker-compose.yml for the rotation settings.
const consoleTransport = new winston.transports.Console({
  format: Config.LOG_FORMAT === 'json' ? jsonLogsFormat : prettyLogsFormat,
  handleExceptions: true,
});

export const logger = winston.createLogger({
  silent: Config.LOG_LEVEL === 'silent',
  level: Config.LOG_LEVEL === 'silent' ? 'error' : Config.LOG_LEVEL,
  transports: [consoleTransport],
  exitOnError: false, // Do not exit on handled exceptions
  defaultMeta: {
    pid: process.pid,
    role: cluster.isPrimary ? 'primary' : 'worker',
  },
});
