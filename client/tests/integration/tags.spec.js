/* eslint-disable no-await-in-loop */
// @ts-check

import { test, expect } from '@playwright/test';
import generateAuth from './fixtures/auth';
import generatePost from './fixtures/post';

const tags = ['tag1', 'tag2', 'tag3'];
const post = generatePost({
  tags,
});
const tagToClick = tags[0];

test.beforeEach(async ({ context }) => {
  await context.route('*/**/users/get-auth', async (route) => {
    await route.fulfill({
      json: generateAuth({
        isAuth: true,
      }),
    });
  });

  await context.route(`*/**/posts/${post.slug}`, async (route) => {
    await route.fulfill({
      json: post,
    });
  });

  await context.route('*/**/comments*', async (route) => {
    await route.fulfill({
      json: {
        pages: 0,
        comments: [],
      },
    });
  });

  await context.route('*/**/tags/**/follow', async (route) => {
    await route.fulfill({
      json: {
        ok: true,
      },
    });
  });
});

test('Follows a tag', async ({ page }) => {
  await page.goto(`/post/${post.slug}`);

  const tagFollowRequest = page.waitForRequest(
    (res) =>
      res.url().includes(`/tags/${tagToClick}/follow`) &&
      res.method() === 'PUT',
  );

  await page.getByTestId(`post-${post.id}-tag-${tagToClick}`).click();

  await page
    .getByTestId('context-menu')
    .filter({ has: page.getByText('Follow tag') })
    .click();

  await tagFollowRequest;

  await page.getByTestId(`post-${post.id}-tag-${tagToClick}`).click();

  await expect(
    page
      .getByTestId('context-menu')
      .filter({ has: page.getByText('Unfollow tag') }),
  ).toBeVisible();
});

test('Unfollows a tag', async ({ context, page }) => {
  await context.route('*/**/users/get-auth', async (route) => {
    await route.fulfill({
      json: generateAuth({
        isAuth: true,
        tagsFollowed: [tagToClick],
      }),
    });
  });

  await page.goto(`/post/${post.slug}`);

  const tagFollowRequest = page.waitForRequest(
    (res) =>
      res.url().includes(`/tags/${tagToClick}/follow`) &&
      res.method() === 'DELETE',
  );

  await page.getByTestId(`post-${post.id}-tag-${tagToClick}`).click();

  await page
    .getByTestId('context-menu')
    .filter({ has: page.getByText('Unfollow tag') })
    .click();

  await tagFollowRequest;

  await page.getByTestId(`post-${post.id}-tag-${tagToClick}`).click();

  await expect(
    page
      .getByTestId('context-menu')
      .filter({ has: page.getByText('Follow tag') }),
  ).toBeVisible();
});

test('Cannot follow or unfollow a tag if not logged in', async ({
  context,
  page,
}) => {
  await context.route('*/**/users/get-auth', async (route) => {
    await route.fulfill({
      json: generateAuth(),
    });
  });

  await page.goto(`/post/${post.slug}`);

  await page.getByTestId(`post-${post.id}-tag-${tagToClick}`).click();

  await expect(
    page
      .getByTestId('context-menu')
      .filter({ has: page.getByText('Follow tag') }),
  ).toBeHidden();

  await expect(
    page
      .getByTestId('context-menu')
      .filter({ has: page.getByText('Unfollow tag') }),
  ).toBeHidden();
});
