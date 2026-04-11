import session from 'express-session';
import MongoStore from 'connect-mongo';
import type { Connection } from 'mongoose';
import Config from '@config/index';
import { SESSION_COOKIE_NAME } from '@constants/index';

export default (db: Connection) =>
  session({
    name: SESSION_COOKIE_NAME,
    secret: Config.SESSION_SECRET,
    resave: true,
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
    }),
  });
