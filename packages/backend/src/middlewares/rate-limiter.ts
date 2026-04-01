import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import MongoStore from 'rate-limit-mongo';
import Config from '@config/index';

export interface RateLimiterOptions {
  windowMs: number;
  max: number;
  message?: string;
}

const createStore = (uri: string) =>
  new MongoStore({
    uri,
    collectionName: 'rate_limits',
    expireTimeMs: 60 * 1000,
  });

export function createRateLimiter(options: RateLimiterOptions) {
  const { windowMs, max, message } = options;

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => Config.IS_JEST || !Config.RATE_LIMIT_ENABLED,
    store: Config.RATE_LIMIT_ENABLED ? createStore(Config.DB_URL) : undefined,
    keyGenerator: (req) => {
      if (req.session?.userId) {
        return `user:${req.session.userId}`;
      }
      return ipKeyGenerator(req.ip || 'unknown');
    },
    handler: (_req, res) => {
      res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: message || 'Too many requests, please try again later.',
        },
      });
    },
  });
}

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: Config.RATE_LIMIT_AUTH_MAX,
  message: 'Too many authentication attempts, please try again later.',
});

export const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: Config.RATE_LIMIT_UPLOAD_MAX,
  message: 'Too many uploads, please try again later.',
});

export const writeRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: Config.RATE_LIMIT_WRITE_MAX,
  message: 'Too many requests, please slow down.',
});

export const voteRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: Config.RATE_LIMIT_VOTE_MAX,
  message: 'Too many votes, please slow down.',
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: Config.RATE_LIMIT_API_MAX,
});
