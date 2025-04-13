import mongoose from 'mongoose';
import { startApp } from '@app';

jest.mock('@utils/remove-file-by-path');

beforeAll(async () => {
  global.app = await startApp();
});

beforeEach(async () => {
  await mongoose.connection.dropDatabase();
});

afterAll(async () => {
  await mongoose.connection.close();
});
