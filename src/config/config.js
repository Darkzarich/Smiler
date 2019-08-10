const dotenv = require('dotenv');
const path = require('path');

const root = path.join.bind(this, path.join(__dirname, '../../'));
dotenv.config({ path: root('.env') });

module.exports = {
  PORT: process.env.PORT || 3000,
  DB_URL: `mongodb+srv://${process.env.DB_LOGIN}:${process.env.DB_PASSWORD}@expressrestblogtest-esklf.mongodb.net/test?retryWrites=true&w=majority`,
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  SESSION_SECRET: process.env.SESSION_SECRET || 'no-secret',
};
