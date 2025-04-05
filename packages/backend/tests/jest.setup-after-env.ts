import mongoose from 'mongoose';
import { startApp } from '../src/app';

beforeAll(async () => {
  global.app = await startApp();
});

beforeEach(async () => {
  await mongoose.connection.dropDatabase();
});

afterAll(async () => {
  await mongoose.connection.close();
});
