// @ts-check

import { test, expect } from '@playwright/test';
import generateAuth from './fixtures/auth';

const authUser = generateAuth(true);

test.beforeEach(async ({ context }) => {
  await context.route('*/**/users/get-auth', async (route) => {
    await route.fulfill({
      json: authUser,
    });
  });

  await context.route(`*/**/api/users/${authUser.login}/template`, async (route) => {
    await route.fulfill({
      json: { title: '', sections: [], tags: [] },
    });
  });
});

test('Creates a post with title, tags and content', async ({ page }) => {
  await page.goto('/post/create');

  await expect(page.getByTestId('post-create-header')).toBeVisible();

  await page.getByTestId('post-title-input').fill('Test post');

  await page.getByTestId('post-tag-input').fill('test tag');
  await page.keyboard.press('Enter');

  await page.getByTestId('post-tag-input').fill('test tag 2');
  await page.keyboard.press('Enter');

  await page.getByTestId('add-text-button').click();
  await page.getByTestId('text-editor').fill('test text');

  await page.getByTestId('add-pic-button').click();
  await page.getByTestId('image-url-input').fill('https://placehold.co/600x400');
  await page.getByTestId('image-upload-button').click();

  await page.getByTestId('add-video-button').click();
  await page.getByTestId('video-url-input').fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');

  // eslint-disable-next-line no-unused-vars
  const [_, createPostRequest] = await Promise.all([
    page.getByTestId('create-post-button').click(),
    page.waitForRequest((res) => res.url().includes('/posts') && res.method() === 'POST'),
  ]);

  expect(createPostRequest.postDataJSON()).toMatchObject({
    sections: [
      {
        type: 'text',
        content: 'test text',
      },
      {
        type: 'pic',
        url: 'https://placehold.co/600x400',
      },
      {
        type: 'vid',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      },
    ],
    title: 'Test post',
    tags: ['test tag', 'test tag 2'],
  });
});

// await expect(page.getByTestId('post-tags-list')).toContainText('test tag');
