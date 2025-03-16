import cors from 'cors';
import { logger } from '../libs/logger';
import Config from '../config/index';

const whitelist = [
  Config.FRONT_ORIGIN_LOCAL,
  Config.FRONT_ORIGIN_REMOTE,
  `http://localhost:${Config.PORT}`,
];

export default cors({
  credentials: true,
  origin(origin, callback) {
    if (
      origin === undefined ||
      whitelist.indexOf(origin) !== -1 ||
      !Config.IS_PRODUCTION
    ) {
      callback(null, true);
    } else {
      logger.warn(`"${origin}" is not allowed by CORS`);
      callback(new Error('Not allowed by CORS'));
    }
  },
});
