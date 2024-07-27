/// @ts-check

const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async () => {
  const mongod = await MongoMemoryServer.create({
    binary: {
      version: '5.0.10',
    },
    instance: {
      port: 27017,
    },
  });

  const uri = mongod.getUri();

  process.env.DB_URL = uri;

  global.mongod = mongod;
};
