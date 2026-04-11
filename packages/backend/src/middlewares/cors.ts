import cors from 'cors';
import { logger } from '@libs/logger';
import Config from '@config/index';
import { isAllowedOrigin } from '@utils/allowed-origins';

export default cors({
  credentials: true,
  origin(origin, callback) {
    if (
      origin === undefined ||
      isAllowedOrigin(origin) ||
      !Config.IS_PRODUCTION
    ) {
      callback(null, true);
    } else {
      logger.warn(`"${origin}" is not allowed by CORS`);
      callback(new Error('Not allowed by CORS'));
    }
  },
});
