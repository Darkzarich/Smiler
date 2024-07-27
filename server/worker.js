/// @ts-check

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const addRequestId = require('express-request-id')();
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const cors = require('cors');

const morganMiddleware = require('./src/config/morgan');
const logger = require('./src/config/logger');
const connectDB = require('./db');
const config = require('./src/config/config');

const router = require('./src/routes');

const {
  PORT,
  FRONT_ORIGIN_LOCAL,
  FRONT_ORIGIN_REMOTE,
  SESSION_SECRET,
  IS_PRODUCTION,
} = config;

const whitelist = [
  FRONT_ORIGIN_LOCAL,
  FRONT_ORIGIN_REMOTE,
  `http://localhost:${PORT}`,
];

logger.info(
  `[pid: ${process.pid}] Worker is running in ${IS_PRODUCTION ? 'PRODUCTION' : 'DEV'} mode.`,
);

async function main() {
  const db = await connectDB();

  const app = express();

  app.use(helmet());

  app.use(
    cors({
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
    }),
  );

  // Unique request id
  app.use(addRequestId);

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  if (IS_PRODUCTION) {
    app.set('trust proxy', 1);
  }

  app.use(
    session({
      secret: SESSION_SECRET,
      resave: true,
      cookie: {
        secure: IS_PRODUCTION,
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 1000,
      },
      saveUninitialized: false,
      store: new MongoStore({
        mongooseConnection: db,
      }),
    }),
  );

  app.use(morganMiddleware);

  app.use(router);

  // TODO: make it conditional, make static only for dev
  // set files folder
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  const server =app.listen(PORT, () => {
    logger.info(
      `[pid: ${process.pid}] Server is listening on the port ${PORT}`,
    );
  });

  return {
    app,
    server,
  };
}

module.exports = main;
