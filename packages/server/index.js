// Start the app in cluster mode

import Cluster from 'node:cluster';
import os from 'node:os';
import Config from './src/config/index.js';
import { logger } from './src/libs/logger.js';

const numCPUs = os.cpus().length;

// Setting up the amount of workers
const amountOfWorkers = Config.IS_PRODUCTION ? numCPUs : 2;

if (Cluster.isPrimary) {
  logger.info(`Master cluster is setting up ${amountOfWorkers} workers...`);

  for (let i = 0; i < amountOfWorkers; i += 1) {
    // Start a new worker
    Cluster.fork();
  }

  Cluster.on('online', (worker) => {
    logger.info(`[pid: ${worker.process.pid}] Worker is online`);
  });

  Cluster.on('exit', (worker, code, signal) => {
    logger.error(
      `Worker ${worker.process.pid} died with code [${code}] and signal [${signal}]`,
    );

    logger.info('Starting a new worker');

    // Start a new worker after the current one dies
    Cluster.fork();
  });
} else {
  process.on('unhandledRejection', (error) => {
    throw error;
  });

  process.on('uncaughtException', (error) => {
    throw error;
  });

  // Runs the app in the worker process
  import('./src/app.js').then((app) => {
    app.default.startApp();
  });
}
