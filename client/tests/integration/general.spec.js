/* eslint-disable no-await-in-loop */
// @ts-check

import { expect } from '@playwright/test';
import generateAuth from './factory/auth';
import test from './page-objects';

test.beforeEach(async ({ Api }) => {
  Api.routes.auth.getAuth.mock({
    body: generateAuth(),
  });
});

test('Redirects to 404 page if page does not exist', async ({ page }) => {
  await page.goto('/not/existing-page');

  await expect(page).toHaveURL('/error/404');
  await expect(page).toHaveTitle('404 Not Found | Smiler');
});
