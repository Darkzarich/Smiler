import { defineConfig, devices } from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

module.exports = defineConfig({
  testDir: './tests/integration',
  tsconfig: './tests/integration/tsconfig.json',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  workers: process.env.CI ? 1 : undefined,
  timeout: process.env.CI ? 1000 * 30 : 1000 * 5,
  reporter: 'html',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    // GMT+1
    timezoneId: 'Europe/Amsterdam',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run build && npm run serve',
    url: BASE_URL,
    reuseExistingServer: false,
  },
});
