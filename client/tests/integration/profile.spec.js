/* eslint-disable no-await-in-loop */
// @ts-check

import { test, expect } from '@playwright/test';
import generateAuth from './factory/auth';
import generatePost from './factory/post';
import generateProfile from './factory/profile';

const post = generatePost({
  id: '1',
});

const testUser = generateProfile();
const auth = generateAuth();

test.beforeEach(async ({ context }) => {
  await context.route('**/users/get-auth', async (route) => {
    await route.fulfill({
      json: auth,
    });
  });

  await context.route('**/posts*', async (route) => {
    await route.fulfill({
      json: {
        pages: 0,
        posts: [post],
      },
    });
  });

  await context.route(`**/users/${testUser.login}`, async (route) => {
    await route.fulfill({
      json: testUser,
    });
  });
});

test('Goes to 404 if user does not exist', async ({ context, page }) => {
  await context.route('**/users/non-existing-user', async (route) => {
    await route.fulfill({
      status: 404,
      json: {
        error: {
          message: 'User not found',
        },
      },
    });
  });

  await page.goto('/user/@non-existing-user');

  await page.waitForURL('**/error/404');
  await expect(page).toHaveTitle('404 Not Found | Smiler');
  await expect(page.getByTestId('system-notification')).toContainText(
    'User not found',
  );
});

test('Fetches and shows user profile', async ({ page }) => {
  const userRequest = page.waitForRequest(`**/users/${testUser.login}`);

  await page.goto(`/user/@${testUser.login}`);

  await userRequest;

  await expect(page).toHaveTitle(`${testUser.login} | Smiler`);
  await expect(page.getByTestId('user-profile-login')).toContainText(
    testUser.login,
  );
  await expect(page.getByTestId('user-profile-rating')).toContainText(
    testUser.rating.toString(),
  );
  await expect(page.getByTestId('user-profile-followers')).toContainText(
    testUser.followersAmount.toString(),
  );
  await expect(page.getByTestId('user-profile-bio')).toContainText(
    testUser.bio,
  );
  await expect(page.getByTestId('user-profile-unfollow-btn')).toBeHidden();
  await expect(page.getByTestId('user-profile-follow-btn')).toBeHidden();
});

test('Fetches user posts with expected filters', async ({ page }) => {
  const postRequest = page.waitForRequest('*/**/posts*');

  await page.goto(`/user/@${testUser.login}`);

  const postResponse = await postRequest;

  expect(postResponse.url()).toContain(
    `author=${testUser.login}&limit=20&offset=0`,
  );

  await expect(page.getByTestId(`post-${post.id}-title`)).toContainText(
    post.title,
  );
});

test.describe('Follows and unfollow', () => {
  test.beforeEach(async ({ context }) => {
    await context.route('**/users/get-auth', async (route) => {
      await route.fulfill({
        json: generateAuth({
          isAuth: true,
          login: `_${testUser.login}`,
        }),
      });
    });

    await context.route(`**/users/${testUser.id}/follow`, async (route) => {
      await route.fulfill({
        json: {
          ok: true,
        },
      });
    });
  });

  test('Follows a different user, followers count increases', async ({
    page,
  }) => {
    await page.goto(`/user/@${testUser.login}`);

    const followRequest = page.waitForRequest(
      (res) =>
        res.url().includes(`/users/${testUser.id}/follow`) &&
        res.method() === 'PUT',
    );

    await page.getByTestId('user-profile-follow-btn').click();

    await followRequest;

    await expect(page.getByTestId('user-profile-unfollow-btn')).toBeVisible();
    await expect(page.getByTestId('user-profile-followers')).toContainText(
      (testUser.followersAmount + 1).toString(),
    );
  });

  test('Unfollows a followed user, followers count decreases', async ({
    page,
    context,
  }) => {
    await context.route(`**/users/${testUser.login}`, async (route) => {
      await route.fulfill({
        json: generateProfile({
          followersAmount: testUser.followersAmount + 1,
          isFollowed: true,
        }),
      });
    });

    await page.goto(`/user/@${testUser.login}`);

    const unfollowRequest = page.waitForRequest(
      (res) =>
        res.url().includes(`/users/${testUser.id}/follow`) &&
        res.method() === 'DELETE',
    );

    await page.getByTestId('user-profile-unfollow-btn').click();

    await unfollowRequest;

    await expect(page.getByTestId('user-profile-follow-btn')).toBeVisible();
    await expect(page.getByTestId('user-profile-followers')).toContainText('0');
  });

  test('Can not follow or unfollow yourself', async ({ page, context }) => {
    await context.route('**/users/get-auth', async (route) => {
      await route.fulfill({
        json: generateAuth({
          isAuth: true,
        }),
      });
    });

    await page.goto(`/user/@${testUser.login}`);

    await expect(page.getByTestId('user-profile-unfollow-btn')).toBeHidden();
    await expect(page.getByTestId('user-profile-follow-btn')).toBeHidden();
  });
});
