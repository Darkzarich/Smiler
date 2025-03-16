import { MongoMemoryServer } from 'mongodb-memory-server';

export default async () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Running tests in a production environment!');
  }

  const mongod = await MongoMemoryServer.create({
    instance: {
      port: 27018,
    },
    binary: {
      version: '5.0.10',
    },
  });

  process.env.DB_URL = `${mongod.getUri()}smiler-test`;

  global.mongod = mongod;
};
