import { createDefaultPreset, pathsToModuleNameMapper } from 'ts-jest';
import { compilerOptions } from './tsconfig.json';

/** @type {import('jest').Config} */
module.exports = {
  ...createDefaultPreset(),
  testEnvironment: 'node',
  verbose: true,
  testMatch: ['**/tests/**/*.spec.ts'],
  globalSetup: './tests/jest.setup.ts',
  globalTeardown: './tests/jest.teardown.ts',
  // Runs after the test framework has been installed in the environment. Before each spec file.
  setupFilesAfterEnv: ['./tests/jest.setup-after-env.ts'],
  watchPathIgnorePatterns: ['node_modules'],
  testTimeout: 30000,
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>/',
  }),
};
