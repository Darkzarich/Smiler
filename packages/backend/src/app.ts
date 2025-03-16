import { join } from 'path';
import express from 'express';
import helmet from 'helmet';
import { requestIdMiddleware } from './middlewares/request-id';
import Config from './config/index';
import { connectDB } from './libs/db';
import { logger } from './libs/logger';
import morganMiddleware from './middlewares/morgan';
import corsMiddleware from './middlewares/cors';
import sessionMiddleware from './middlewares/session';
import router from './routes/index';

logger.info(
  `[pid: ${process.pid}] Worker is running in ${Config.IS_PRODUCTION ? 'PRODUCTION' : 'DEV'} mode.`,
);

export async function startApp() {
  logger.info(`[pid: ${process.pid}] App is starting...`);

  const db = await connectDB();

  const app = express();

  // Add basic security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: {
        policy: 'same-site',
      },
    }),
  );

  app.use(corsMiddleware);

  // Add unique request id
  app.use(requestIdMiddleware());

  // Parse JSON and URL-encoded data
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json({}));

  if (Config.IS_PRODUCTION) {
    app.set('trust proxy', 1);
  }

  if (db) {
    app.use(sessionMiddleware(db));
  }

  // Add logger for requests
  app.use(morganMiddleware);

  app.use(router);

  // TODO: make it conditional, make static only for dev
  // Set files folder
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  if (!Config.IS_JEST) {
    app.listen(Config.PORT, () => {
      logger.info(
        `[pid: ${process.pid}] Server is listening on the port ${Config.PORT}`,
      );
    });
  }

  logger.info(
    `[pid: ${process.pid}] App has successfully started in ${Config.IS_PRODUCTION ? 'PRODUCTION' : 'DEV'} mode`,
  );

  return app;
}
