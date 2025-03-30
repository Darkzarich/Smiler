/* eslint-disable node/no-unsupported-features/es-syntax */
import mongoose from 'mongoose';
import { startApp } from '../src/app';

beforeAll(async () => {
  global.app = await startApp();
});

beforeEach(async () => {
  await mongoose.connection.dropDatabase();

  jest.mock('../utils/remove-file-by-path', () => ({
    removeFileByPath: jest.fn(),
  }));
});

afterAll(async () => {
  await mongoose.connection.close();
});
