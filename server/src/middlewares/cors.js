const cors = require('cors');
const { logger } = require('../libs/logger');

const {
  PORT,
  FRONT_ORIGIN_LOCAL,
  FRONT_ORIGIN_REMOTE,
  IS_PRODUCTION,
} = require('../config/config');

const whitelist = [
  FRONT_ORIGIN_LOCAL,
  FRONT_ORIGIN_REMOTE,
  `http://localhost:${PORT}`,
];

module.exports = cors({
  credentials: true,
  origin(origin, callback) {
    if (
      origin === undefined ||
      whitelist.indexOf(origin) !== -1 ||
      !IS_PRODUCTION
    ) {
      callback(null, true);
    } else {
      logger.warn(`"${origin}" is not allowed by CORS`);
      callback(new Error('Not allowed by CORS'));
    }
  },
});
