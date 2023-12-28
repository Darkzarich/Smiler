// @ts-check
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ context }) => {
  await context.route('*/**/api/users/get-auth', async (route) => {
    await route.fulfill({
      json: {
        isAuth: false,
      },
    });
  });

  await context.route('*/**/api/posts*', async (route) => {
    await route.fulfill({
      json: {
        pages: 0,
        posts: [
          {
            title: 'Test post',
            sections: [
              {
                type: 'pic',
                hash: 'test123',
                url: '/assets/neutral_avatar-f439ba56.png',
              },
            ],
            slug: 'test-post-123',
            author: {
              login: 'TestUser',
              id: '1',
            },
            id: '1',
            commentCount: 0,
            rating: 2,
            createdAt: '2024-01-31T00:00:00.000Z',
            tags: [],
            rated: {
              isRated: false,
              negative: false,
            },
          },
        ],
      },
    });
  });
});

test('loads posts', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Test post')).toBeVisible();
});
