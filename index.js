const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const config = require('./src/config/config');

const amountOfWorkers = config.IS_PRODUCTION ? numCPUs : 1;

if (cluster.isMaster) {
  global.console.log(`Master cluster setting up ${amountOfWorkers} workers...`);

  for (let i = 0; i < amountOfWorkers; i += 1) {
    cluster.fork();
  }

  cluster.on('online', (worker) => {
    global.console.log(`Worker ${worker.process.pid} is online`);
  });

  cluster.on('exit', (worker, code, signal) => {
    global.console.log(`Worker ${worker.process.pid} died with code: ${code}, and signal: ${signal}`);
    global.console.log('Starting a new worker');
    cluster.fork();
  });
} else {
  require('./worker');
}
