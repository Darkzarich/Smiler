/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  verbose: true,
  testMatch: ['**/src/**/*.spec.js'],
  globalSetup: './jest.setup.js',
  globalTeardown: './jest.teardown.js',
  watchPathIgnorePatterns: ['node_modules'],
};

export default config;
