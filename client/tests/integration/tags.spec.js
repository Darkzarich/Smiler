/* eslint-disable no-await-in-loop */
// @ts-check

import { expect } from '@playwright/test';
import generateAuth from './factory/auth';
import generatePost from './factory/post';
import test from './page-objects';

const tags = ['tag1', 'tag2', 'tag3'];
const post = generatePost({
  tags,
});
const tagToClick = tags[0];

test.beforeEach(async ({ Api }) => {
  Api.routes.auth.getAuth.mock({
    body: generateAuth({
      isAuth: true,
    }),
  });

  Api.routes.posts.getPostBySlug.mock({
    body: post,
  });

  Api.routes.comments.getComments.mock({
    body: {
      pages: 0,
      comments: [],
    },
  });

  Api.routes.tags.follow.mock({
    body: {
      ok: true,
    },
  });

  Api.routes.tags.unfollow.mock({
    body: {
      ok: true,
    },
  });
});

test('Follows a tag', async ({ page, Api }) => {
  await page.goto(`/post/${post.slug}`);

  await page.getByTestId(`post-${post.id}-tag-${tagToClick}`).click();

  await Api.routes.tags.follow.waitForRequest({
    beforeAction: async () => {
      await page
        .getByTestId('context-menu')
        .filter({ has: page.getByText('Follow tag') })
        .click();
    },
  });

  await page.getByTestId(`post-${post.id}-tag-${tagToClick}`).click();

  await expect(
    page
      .getByTestId('context-menu')
      .filter({ has: page.getByText('Unfollow tag') }),
  ).toBeVisible();
});

test('Unfollows a tag', async ({ page, Api }) => {
  Api.routes.auth.getAuth.mock({
    body: generateAuth({
      isAuth: true,
      tagsFollowed: [tagToClick],
    }),
  });

  await page.goto(`/post/${post.slug}`);

  await page.getByTestId(`post-${post.id}-tag-${tagToClick}`).click();

  await Api.routes.tags.unfollow.waitForRequest({
    beforeAction: async () => {
      await page
        .getByTestId('context-menu')
        .filter({ has: page.getByText('Unfollow tag') })
        .click();
    },
  });

  await page.getByTestId(`post-${post.id}-tag-${tagToClick}`).click();

  await expect(
    page
      .getByTestId('context-menu')
      .filter({ has: page.getByText('Follow tag') }),
  ).toBeVisible();
});

test('Cannot follow or unfollow a tag if not logged in', async ({
  page,
  Api,
}) => {
  Api.routes.auth.getAuth.mock({
    body: generateAuth(),
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
