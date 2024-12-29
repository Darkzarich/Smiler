/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  verbose: true,
  testMatch: ['**/src/**/*.spec.js'],
  globalSetup: './src/tests/jest.setup.js',
  globalTeardown: './src/tests/jest.teardown.js',
  // Runs after the test framework has been installed in the environment. Before each spec file.
  setupFilesAfterEnv: ['./src/tests/jest.setup-after-env.js'],
  watchPathIgnorePatterns: ['node_modules'],
};

export default config;
