import session from 'express-session';
import connectMongo from 'connect-mongo';
import Config from '../config/index';

const MongoStore = connectMongo(session);

export default (db) =>
  session({
    secret: Config.SESSION_SECRET,
    resave: true,
    cookie: {
      secure: Config.IS_PRODUCTION,
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // a week
    },
    saveUninitialized: false,
    store: new MongoStore({
      mongooseConnection: db,
    }),
  });
