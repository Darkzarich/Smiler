const dotenv = require('dotenv');
const path = require('path');

const root = path.join.bind(this, path.join(__dirname, '../../'));

dotenv.config({ path: root('.env') });

module.exports = {
  PORT: process.env.PORT || 3000,
  DB_URL: process.env.DB_URI || 'mongodb://localhost:27017/smiler',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  SESSION_SECRET: process.env.SESSION_SECRET || 'no-secret',
  FRONT_ORIGIN_LOCAL: process.env.FRONT_ORIGIN_LOCAL || 'http://localhost:8080/',
  FRONT_ORIGIN_REMOTE: process.env.FRONT_ORIGIN_REMOTE,
};
