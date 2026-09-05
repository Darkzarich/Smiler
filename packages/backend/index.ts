// Start the app in cluster mode

import Cluster from 'node:cluster';
import type { Server } from 'node:http';
import os from 'node:os';
import Config from '@config/index';
import { logger } from '@libs/logger';
import { startApp } from './src/app';

const numCPUs = os.cpus().length;

// How long a worker may spend draining before it's killed off
const FATAL_ERROR_SHUTDOWN_TIMEOUT = 10 * 1000;

// Setting up the amount of workers
const amountOfWorkers = Config.IS_PRODUCTION ? numCPUs : 2;

if (Cluster.isPrimary) {
  logger.info('cluster_starting', { workers: amountOfWorkers });

  for (let i = 0; i < amountOfWorkers; i += 1) {
    // Start a new worker
    Cluster.fork();
  }

  Cluster.on('online', (worker) => {
    logger.info('cluster_worker_online', { workerPid: worker.process.pid });
  });

  Cluster.on('exit', (worker, code, signal) => {
    // `workerPid` rather than `pid`: the latter is stamped on every line by the
    // logger and belongs to the primary that is reporting the death.
    logger.error('cluster_worker_died', {
      workerPid: worker.process.pid,
      code,
      signal,
    });

    // Start a new worker after the current one dies
    Cluster.fork();
  });
} else {
  let server: Server | undefined;
  let isShuttingDown = false;

  // The process is in an unknown state after a fatal error, so the worker stops
  // taking new connections, lets the in-flight ones finish and then dies,
  // which makes the primary fork a replacement
  const shutdownOnFatalError = (error: unknown, origin: string) => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;

    logger.error('worker_fatal_error', {
      origin,
      error: error instanceof Error ? error : new Error(String(error)),
    });

    const exit = () => process.exit(1);

    // stdout is a pipe under Docker, so Winston's writes are asynchronous
    // there — give them a chance to flush
    logger.on('finish', exit);

    // ... but never let a stuck connection or transport keep the worker alive
    setTimeout(exit, FATAL_ERROR_SHUTDOWN_TIMEOUT).unref();

    if (server) {
      server.close(() => logger.end());
    } else {
      logger.end();
    }
  };

  process.on('unhandledRejection', (error) => {
    shutdownOnFatalError(error, 'Unhandled rejection');
  });

  process.on('uncaughtException', (error) => {
    shutdownOnFatalError(error, 'Uncaught exception');
  });

  // Runs the app in the worker process
  startApp().then((startedApp) => {
    server = startedApp.server;
  });
}
