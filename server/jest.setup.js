/// @ts-check

const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async () => {
  const mongod = await MongoMemoryServer.create({
    binary: {
      version: '5.0.10',
    },
  });

  process.env.DB_URL = mongod.getUri();

  global.mongod = mongod;
};
