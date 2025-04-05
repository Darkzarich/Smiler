import mongoose from 'mongoose';
import { startApp } from '../src/app';

jest.mock('../src/utils/remove-file-by-path');

beforeAll(async () => {
  global.app = await startApp();
});

beforeEach(async () => {
  await mongoose.connection.dropDatabase();
});

afterAll(async () => {
  await mongoose.connection.close();
});
