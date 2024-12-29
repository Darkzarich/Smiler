import mongoose from 'mongoose';
import App from '../app.js';

beforeAll(async () => {
  global.app = await App.startApp();
});

beforeEach(async () => {
  await mongoose.connections[0].dropDatabase();
});

afterAll(async () => {
  await mongoose.connections[0].close();
});
