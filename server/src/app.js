const path = require('path');
const express = require('express');
const helmet = require('helmet');
const requestIdMiddleware = require('express-request-id')();

const { PORT, IS_PRODUCTION, IS_JEST } = require('./config/config');
const { connectDB } = require('./libs/db');
const { logger } = require('./libs/logger');
const morganMiddleware = require('./middlewares/morgan');
const corsMiddleware = require('./middlewares/cors');
const sessionMiddleware = require('./middlewares/session');
const router = require('./routes');

logger.info(
  `[pid: ${process.pid}] Worker is running in ${IS_PRODUCTION ? 'PRODUCTION' : 'DEV'} mode.`,
);

async function startApp({ db = null } = {}) {
  const app = express();

  // Add basic security headers
  app.use(helmet());

  app.use(corsMiddleware);

  // Add unique request id
  app.use(requestIdMiddleware);

  // Parse JSON and URL-encoded data
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json({}));

  if (IS_PRODUCTION) {
    app.set('trust proxy', 1);
  }

  if (db) {
    app.use(sessionMiddleware(db));
  }

  // Add logger for requests
  app.use(morganMiddleware);

  app.use(router);

  // TODO: make it conditional, make static only for dev
  // Set files folder
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  if (!IS_JEST) {
    app.listen(PORT, () => {
      logger.info(
        `[pid: ${process.pid}] Server is listening on the port ${PORT}`,
      );
    });
  }

  return {
    app,
    db,
  };
}

async function run() {
  const db = await connectDB();

  startApp({ db });
}

module.exports = { run, startApp };
