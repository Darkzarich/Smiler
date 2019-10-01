const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const cors = require('cors');
const db = require('./db');
const config = require('./src/config/config');


const router = require('./src/routes');

const app = express();
const { PORT } = config;

const whitelist = [
  config.FRONT_ORIGIN_LOCAL,
  config.FRONT_ORIGIN_REMOTE,
  `http://localhost:${PORT}`,
];

app.use(cors({
  credentials: true,
  origin(origin, callback) {
    if (origin === undefined || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
}));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(
  session({
    secret: config.SESSION_SECRET,
    resave: true,
    saveUninitialized: false,
    store: new MongoStore({
      mongooseConnection: db,
    }),
  }),
);

app.use(router);

if (config.IS_PRODUCTION) {
  app.use('/app/uploads', express.static(path.join(__dirname, 'uploads')));
} else {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

app.listen(PORT, () => {
  global.console.log(`${process.pid} [pid]: Server is listening on the port ${PORT}`);
});
