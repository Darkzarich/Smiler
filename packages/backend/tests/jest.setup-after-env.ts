import mongoose from 'mongoose';
import { startApp } from '@app';

jest.mock('@utils/remove-file-by-path');

beforeAll(async () => {
  ({ app: global.app } = await startApp());
});

beforeEach(async () => {
  // Emptying the collections instead of dropping the database on purpose:
  // dropDatabase aborts index builds that are still in flight, which permanently
  // rejects the cached collection promise connect-mongo builds its TTL index on.
  const collections = await mongoose.connection.db!.collections();

  await Promise.all(collections.map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await mongoose.connection.close();
});
