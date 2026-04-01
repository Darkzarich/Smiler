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
} = process.env;

export default {
  PORT: BACKEND_PORT || 3000,
  DB_URL:
    DB_URL ||
    `mongodb://localhost:${DB_PORT || 27017}/${MONGO_INITDB_DATABASE}?authSource=admin`,
  IS_PRODUCTION: NODE_ENV === 'production',
  IS_JEST: NODE_ENV === 'test',
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
