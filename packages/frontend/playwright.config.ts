import { defineConfig, devices } from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

module.exports = defineConfig({
  testDir: './tests/integration',
  tsconfig: './tests/integration/tsconfig.json',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Each project spins up a full browser, so keep the local fan-out modest
  workers: process.env.CI ? 1 : 2,
  retries: 2,
  timeout: 1000 * 30,
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
