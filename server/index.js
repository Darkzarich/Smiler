// Start the app in cluster mode

const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const config = require('./src/config/config');
const { logger } = require('./src/libs/logger');

// Setting up the amount of workers
const amountOfWorkers = config.IS_PRODUCTION ? numCPUs : 2;

if (cluster.isMaster) {
  logger.info(`Master cluster setting up ${amountOfWorkers} workers...`);

  for (let i = 0; i < amountOfWorkers; i += 1) {
    // Start a new worker
    cluster.fork();
  }

  cluster.on('online', (worker) => {
    logger.info(`[pid: ${worker.process.pid}] Worker is online`);
  });

  cluster.on('exit', (worker, code, signal) => {
    logger.error(
      `Worker ${worker.process.pid} died with code: ${code}, and signal: ${signal}`,
    );

    logger.info('Starting a new worker');

    // Start a new worker after the current one dies
    cluster.fork();
  });
} else {
  // eslint-disable-next-line global-require

  // Runs the app in the worker process
  require('./src/app').run();

  process.on('unhandledRejection', (error) => {
    throw error;
  });

  process.on('uncaughtException', (error) => {
    throw error;
  });
}
