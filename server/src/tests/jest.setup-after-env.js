import mongoose from 'mongoose';
import App from '../app.js';

beforeAll(async () => {
  global.app = await App.startApp();
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
});

beforeEach(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
  }
});
