/* eslint-disable node/no-unsupported-features/es-syntax */
import mongoose from 'mongoose';

// TODO: Remove after moving to TypeScript
import.meta.jest.unstable_mockModule('../utils/remove-file-by-path.js', () => ({
  removeFileByPath: import.meta.jest.fn(),
}));

const appModule = await import('../app.js');

beforeAll(async () => {
  global.app = await appModule.default.startApp();
});

beforeEach(async () => {
  await mongoose.connection.dropDatabase();
});

afterAll(async () => {
  await mongoose.connection.close();
});
