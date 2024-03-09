/* eslint-disable no-await-in-loop */
// @ts-check

import { test, expect } from '@playwright/test';
import generateAuth from './fixtures/auth';

test.beforeEach(async ({ context }) => {
  await context.route('*/**/users/get-auth', async (route) => {
    await route.fulfill({
      json: generateAuth(),
    });
  });
});

test('Redirects to 404 page if page does not exist', async ({ page }) => {
  await page.goto('/not/existing-page');

  await expect(page).toHaveURL('/error/404');
  await expect(page).toHaveTitle('404 Not Found | Smiler');
});
