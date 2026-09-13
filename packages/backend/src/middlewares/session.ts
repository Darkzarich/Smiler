import session from 'express-session';
import { RedisStore } from 'connect-redis';
import Config from '@config/index';
import { SESSION_COOKIE_NAME } from '@constants/index';
import type { RedisClient } from '@libs/redis';

export default (redis: RedisClient | undefined) =>
  session({
    name: SESSION_COOKIE_NAME,
    secret: Config.SESSION_SECRET,
    // Redis stores the session under its own key and touches its TTL, so there
    // is nothing to rewrite when a request changes nothing
    resave: false,
    cookie: {
      secure: Config.IS_PRODUCTION,
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // a week
    },
    saveUninitialized: false,
    // Tests run without Redis, and express-session falls back to the in-memory
    // store of the process the requests are served by
    store: redis
      ? new RedisStore({ client: redis, prefix: 'session:' })
      : undefined,
  });
