const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

const { SESSION_SECRET, IS_PRODUCTION } = require('../config/config');

module.exports = (db) =>
  session({
    secret: SESSION_SECRET,
    resave: true,
    cookie: {
      secure: IS_PRODUCTION,
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // a week
    },
    saveUninitialized: false,
    store: new MongoStore({
      mongooseConnection: db,
    }),
  });
