import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.spec.ts'],
    globalSetup: './tests/global-setup.ts',
    testTimeout: 30000,
  },
});
