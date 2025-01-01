import mongoose from 'mongoose';
import App from '../app.js';

beforeAll(async () => {
  global.app = await App.startApp();
});

beforeEach(async () => {
  await mongoose.connection.dropDatabase();
});

afterAll(async () => {
  await mongoose.connection.close();
});
