/**
 * Node 22.18+ can strip types from this file natively, but Jest's native path
 * then loads it as ESM, which rejects both the `tsconfig.json` import and
 * `module.exports`. Pinning the loader keeps Jest compiling it with ts-node.
 *
 * @jest-config-loader ts-node
 */
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
