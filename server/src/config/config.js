const dotenv = require('dotenv');
const path = require('path');

const root = path.join.bind(this, path.join(__dirname, '../../'));

// Load environment variables from .env file, won't override any existing environment variables.
dotenv.config({ path: root('../.env') });

module.exports = {
  PORT: process.env.BACKEND_PORT || 3000,
  DB_URL: process.env.DB_URL || `mongodb://localhost:${process.env.DB_PORT || 27017}/smiler?authSource=admin`,
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  SESSION_SECRET: process.env.SESSION_SECRET || 'no-secret',
  FRONT_ORIGIN_LOCAL: process.env.FRONT_ORIGIN_LOCAL || 'http://localhost:8080/',
  FRONT_ORIGIN_REMOTE: process.env.FRONT_ORIGIN_REMOTE,
};
