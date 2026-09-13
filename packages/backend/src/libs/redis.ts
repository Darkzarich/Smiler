import { createClient } from 'redis';
import Config from '@config/index';
import { logger } from '@libs/logger';

const INITIAL_CONNECT_ATTEMPTS = 10;
const MAX_RECONNECT_DELAY_MS = 3000;

async function connect() {
  let hasConnected = false;

  const client = createClient({
    url: Config.REDIS_URL,
    // A request must never wait for a reconnection: a rejected command lets the
    // rate limiter pass the request on, a queued one would hold the response
    // until Redis came back.
    disableOfflineQueue: true,
    socket: {
      // Giving up on the first connection ends the worker with a logged reason
      // instead of hanging the boot. A connection that worked once is worth
      // retrying for as long as the worker lives.
      reconnectStrategy: (retries, cause) =>
        !hasConnected && retries >= INITIAL_CONNECT_ATTEMPTS
          ? cause
          : Math.min((retries + 1) * 200, MAX_RECONNECT_DELAY_MS),
    },
  });

  // Without a listener the client's `error` event is an uncaught exception,
  // which would take the whole worker down over a dropped connection.
  client.on('error', (error) => {
    logger.error('redis_error', { error });
  });

  client.on('reconnecting', () => {
    logger.warn('redis_reconnecting');
  });

  client.on('ready', () => {
    hasConnected = true;

    logger.info('redis_ready');
  });

  try {
    logger.info('redis_connecting');

    await client.connect();

    return client;
  } catch (error) {
    logger.error('redis_initial_connection_failed', { error });

    throw error;
  }
}

export type RedisClient = Awaited<ReturnType<typeof connect>>;

let clientPromise: ReturnType<typeof connect> | undefined;

/** The worker's one Redis connection, shared by the session store and the rate
 * limiter. Connects on the first call. */
export function getRedisClient() {
  if (!clientPromise) {
    clientPromise = connect();
  }

  return clientPromise;
}
