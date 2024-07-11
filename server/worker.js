const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const morgan = require('morgan');
const addRequestId = require('express-request-id')();
const MongoStore = require('connect-mongo')(session);
const cors = require('cors');
const logger = require('./src/config/winston');
const db = require('./db');
const config = require('./src/config/config');

const router = require('./src/routes');

const app = express();

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

console.log('CORS whitelist: ', whitelist.join(','));

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

// X-Request-Id header
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

// logging
morgan.token('request-body', (req, res) => {
  const body = { ...req.body };
  // is not safe to leave insecure user's passwords in logs
  if ('password' in body) {
    body.password = '***';
  }

  if ('confirm' in body) {
    body.confirm = '***';
  }

  return JSON.stringify(body);
});
morgan.token('request-id', (req, res) => req.id);
morgan.token('user', (req, res) => {
  if (req.session && req.session.userId) return req.session.userId;
  return 'no user';
});

const loggerFormat =
  '[req_id: :request-id][uid: :user] [:status] :remote-addr :method :url :response-time ms - :res[content-length] \n body :request-body';

app.use(
  morgan(loggerFormat, {
    skip(req, res) {
      return res.statusCode < 400;
    },
    stream: logger.stream,
  }),
);
app.use(
  morgan(loggerFormat, {
    skip(req, res) {
      return res.statusCode >= 400;
    },
    stream: logger.stream,
  }),
);

// routes
app.use(router);

// set files folder

logger.info(
  `Worker is running in ${IS_PRODUCTION ? 'PRODUCTION' : 'DEV'} mode...`,
);

// TODO: make it conditional, make static only for dev
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(PORT, () => {
  logger.info(`${process.pid} [pid]: Server is listening on the port ${PORT}`);
});
