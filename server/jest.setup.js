const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Running tests in a production environment!');
  }

  const mongod = await MongoMemoryServer.create({
    binary: {
      version: '5.0.10',
    },
    instance: {
      dbName: 'smiler-test',
    },
  });

  process.env.DB_URL = mongod.getUri();

  global.mongod = mongod;
};
