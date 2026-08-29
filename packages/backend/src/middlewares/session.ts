import session from 'express-session';
import MongoStore from 'connect-mongo';
import type { Connection } from 'mongoose';
import Config from '@config/index';
import { SESSION_COOKIE_NAME } from '@constants/index';

export default (db: Connection) =>
  session({
    name: SESSION_COOKIE_NAME,
    secret: Config.SESSION_SECRET,
    // connect-mongo supports touch, no need to rewrite the store on every request
    resave: false,
    cookie: {
      secure: Config.IS_PRODUCTION,
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // a week
    },
    saveUninitialized: false,
    store: MongoStore.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      client: db.getClient() as any,
      // Cookies aren't rolling, so touching only refreshes the store TTL,
      // no need to do it more often than once an hour
      touchAfter: 60 * 60,
    }),
  });
