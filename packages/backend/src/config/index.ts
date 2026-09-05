import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '../../.env') });

const {
  BACKEND_PORT,
  DB_URL,
  MONGO_INITDB_DATABASE,
  NODE_ENV,
  DB_PORT,
  SESSION_SECRET,
  FRONT_ORIGIN_LOCAL,
  FRONTEND_PORT,
  FRONT_ORIGIN_REMOTE,
  RATE_LIMIT_ENABLED,
  RATE_LIMIT_AUTH_MAX,
  RATE_LIMIT_API_MAX,
  RATE_LIMIT_WRITE_MAX,
  RATE_LIMIT_VOTE_MAX,
  RATE_LIMIT_UPLOAD_MAX,
  LOG_LEVEL,
  LOG_FORMAT,
} = process.env;

const IS_PRODUCTION = NODE_ENV === 'production';
const IS_JEST = NODE_ENV === 'test';

const LOG_LEVELS = [
  'error',
  'warn',
  'info',
  'http',
  'verbose',
  'debug',
  'silly',
];

// `silent` is not a Winston level but a flag on the logger; it is accepted here
// so that one variable turns logging off entirely (a quiet test run, mostly).
function resolveLogLevel() {
  if (LOG_LEVEL && [...LOG_LEVELS, 'silent'].includes(LOG_LEVEL)) {
    return LOG_LEVEL;
  }

  // Tests only care about what went wrong, production about what happened,
  // and development about everything.
  if (IS_JEST) {
    return 'error';
  }

  return IS_PRODUCTION ? 'info' : 'debug';
}

function resolveLogFormat() {
  if (LOG_FORMAT === 'json' || LOG_FORMAT === 'pretty') {
    return LOG_FORMAT;
  }

  return IS_PRODUCTION ? 'json' : 'pretty';
}

function validateProductionConfig() {
  if (!IS_PRODUCTION) {
    return;
  }

  if (!SESSION_SECRET || SESSION_SECRET === 'no-secret') {
    throw new Error('SESSION_SECRET must be set in production');
  }
}

validateProductionConfig();

export default {
  PORT: BACKEND_PORT || 3000,
  DB_URL:
    DB_URL ||
    `mongodb://localhost:${DB_PORT || 27017}/${MONGO_INITDB_DATABASE}?authSource=admin`,
  IS_PRODUCTION,
  IS_JEST,
  LOG_LEVEL: resolveLogLevel(),
  LOG_FORMAT: resolveLogFormat(),
  SESSION_SECRET: SESSION_SECRET || 'no-secret',
  FRONT_ORIGIN_LOCAL:
    FRONT_ORIGIN_LOCAL || `http://localhost:${FRONTEND_PORT || 8000}`,
  FRONT_ORIGIN_REMOTE,
  RATE_LIMIT_ENABLED: RATE_LIMIT_ENABLED !== 'false',
  RATE_LIMIT_AUTH_MAX: parseInt(RATE_LIMIT_AUTH_MAX || '10', 10),
  RATE_LIMIT_API_MAX: parseInt(RATE_LIMIT_API_MAX || '100', 10),
  RATE_LIMIT_WRITE_MAX: parseInt(RATE_LIMIT_WRITE_MAX || '30', 10),
  RATE_LIMIT_VOTE_MAX: parseInt(RATE_LIMIT_VOTE_MAX || '60', 10),
  RATE_LIMIT_UPLOAD_MAX: parseInt(RATE_LIMIT_UPLOAD_MAX || '20', 10),
};
