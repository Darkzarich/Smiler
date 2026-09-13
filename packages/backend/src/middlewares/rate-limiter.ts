import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import Config from '@config/index';
import { logger } from '@libs/logger';
import { getRedisClient } from '@libs/redis';

export interface RateLimiterOptions {
  /** Keeps this limiter's counters apart from every other limiter's in Redis. */
  name: string;
  windowMs: number;
  max: number;
  message?: string;
}

/** What Redis answers with, as narrow as `rate-limit-redis` needs it. */
type RedisReply = string | number | (string | number)[];

const isEnabled = Config.RATE_LIMIT_ENABLED && !Config.IS_JEST;

const createStore = (name: string) =>
  new RedisStore({
    prefix: `rate-limit:${name}:`,
    sendCommand: async (...args: string[]) => {
      const client = await getRedisClient();

      return client.sendCommand(args) as Promise<RedisReply>;
    },
  });

// `express-rate-limit` calls this with the error first and a message second,
// which is the opposite of what Winston takes.
const storeLogger = {
  error: (error: unknown) => logger.error('rate_limit_store_error', { error }),
  warn: (error: unknown) => logger.warn('rate_limit_store_warning', { error }),
};

export function createRateLimiter(options: RateLimiterOptions) {
  const { name, windowMs, max, message } = options;

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => !isEnabled,
    store: isEnabled ? createStore(name) : undefined,
    // A limiter that cannot reach Redis must not take the endpoint with it
    passOnStoreError: true,
    logger: storeLogger,
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
  name: 'auth',
  windowMs: 15 * 60 * 1000,
  max: Config.RATE_LIMIT_AUTH_MAX,
  message: 'Too many authentication attempts, please try again later.',
});

export const uploadRateLimiter = createRateLimiter({
  name: 'upload',
  windowMs: 60 * 60 * 1000,
  max: Config.RATE_LIMIT_UPLOAD_MAX,
  message: 'Too many uploads, please try again later.',
});

export const writeRateLimiter = createRateLimiter({
  name: 'write',
  windowMs: 60 * 1000,
  max: Config.RATE_LIMIT_WRITE_MAX,
  message: 'Too many requests, please slow down.',
});

export const voteRateLimiter = createRateLimiter({
  name: 'vote',
  windowMs: 60 * 1000,
  max: Config.RATE_LIMIT_VOTE_MAX,
  message: 'Too many votes, please slow down.',
});

export const apiRateLimiter = createRateLimiter({
  name: 'api',
  windowMs: 60 * 1000,
  max: Config.RATE_LIMIT_API_MAX,
});
