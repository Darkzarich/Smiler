import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file, won't override any existing environment variables.
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
};
