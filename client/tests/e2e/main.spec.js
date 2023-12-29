// @ts-check
import { test, expect } from '@playwright/test';
import generatePost from './fixtures/post';
import generateAuth from './fixtures/auth';

test.beforeEach(async ({ context }) => {
  await context.route('*/**/api/users/get-auth', async (route) => {
    await route.fulfill({
      json: generateAuth(),
    });
  });

  await context.route('*/**/api/posts*', async (route) => {
    await route.fulfill({
      json: {
        pages: 0,
        posts: [
          generatePost(),
        ],
      },
    });
  });
});

test('loads posts', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Test post')).toBeVisible();
});
