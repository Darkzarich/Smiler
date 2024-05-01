/* eslint-disable no-await-in-loop */
// @ts-check

import { expect } from '@playwright/test';
import generateAuth from './factory/auth';
import generatePost from './factory/post';
import generateProfile from './factory/profile';
import test from './page-objects';

const post = generatePost({
  id: '1',
});

const testUser = generateProfile();
const auth = generateAuth();

test.beforeEach(async ({ Api }) => {
  Api.routes.auth.getAuth.mock({
    body: auth,
  });

  Api.routes.posts.getPosts.mock({
    body: {
      pages: 0,
      posts: [post],
    },
  });

  Api.routes.users.getUserProfile.mock({
    body: testUser,
  });
});

test('Goes to 404 if user does not exist', async ({ page, Api }) => {
  Api.routes.users.getUserProfile.mock({
    status: 404,
    body: {
      error: {
        message: 'User not found',
      },
    },
  });

  await page.goto('/user/@non-existing-user');

  await page.waitForURL('**/error/404');
  await expect(page).toHaveTitle('404 Not Found | Smiler');
  await expect(page.getByTestId('system-notification')).toContainText(
    'User not found',
  );
});

test('Fetches and shows user profile', async ({ page, Api }) => {
  const userResponse = await Api.routes.users.getUserProfile.waitForRequest({
    beforeAction: async () => {
      await page.goto(`/user/@${testUser.login}`);
    },
  });

  expect(userResponse.url()).toContain(`/users/${testUser.login}`);
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

test('Fetches user posts with expected filters', async ({ page, Api }) => {
  const postResponse = await Api.routes.posts.getPosts.waitForRequest({
    beforeAction: async () => {
      await page.goto(`/user/@${testUser.login}`);
    },
  });

  expect(postResponse.url()).toContain(
    `author=${testUser.login}&limit=20&offset=0`,
  );

  await expect(page.getByTestId(`post-${post.id}-title`)).toContainText(
    post.title,
  );
});

test.describe('Follows and unfollow', () => {
  test.beforeEach(async ({ Api }) => {
    Api.routes.auth.getAuth.mock({
      body: generateAuth({
        isAuth: true,
        login: `_${testUser.login}`,
      }),
    });

    Api.routes.users.followUser.mock({
      body: {
        ok: true,
      },
    });

    Api.routes.users.unfollowUser.mock({
      body: {
        ok: true,
      },
    });
  });

  test('Follows a different user, followers count increases', async ({
    page,
    Api,
  }) => {
    await page.goto(`/user/@${testUser.login}`);

    const followResponse = await Api.routes.users.followUser.waitForRequest({
      beforeAction: async () => {
        await page.getByTestId('user-profile-follow-btn').click();
      },
    });

    expect(followResponse.url()).toContain(testUser.id);
    await expect(page.getByTestId('user-profile-unfollow-btn')).toBeVisible();
    await expect(page.getByTestId('user-profile-followers')).toContainText(
      (testUser.followersAmount + 1).toString(),
    );
  });

  test('Unfollows a followed user, followers count decreases', async ({
    page,
    Api,
  }) => {
    Api.routes.users.getUserProfile.mock({
      body: generateProfile({
        followersAmount: testUser.followersAmount + 1,
        isFollowed: true,
      }),
    });

    await page.goto(`/user/@${testUser.login}`);

    const unfollowResponse = await Api.routes.users.unfollowUser.waitForRequest(
      {
        beforeAction: async () => {
          await page.getByTestId('user-profile-unfollow-btn').click();
        },
      },
    );

    expect(unfollowResponse.url()).toContain(testUser.id);
    await expect(page.getByTestId('user-profile-follow-btn')).toBeVisible();
    await expect(page.getByTestId('user-profile-followers')).toContainText('0');
  });

  test('Cannot follow or unfollow yourself', async ({ page, Api }) => {
    Api.routes.auth.getAuth.mock({
      body: generateAuth({
        isAuth: true,
      }),
    });

    await page.goto(`/user/@${testUser.login}`);

    await expect(page.getByTestId('user-profile-unfollow-btn')).toBeHidden();
    await expect(page.getByTestId('user-profile-follow-btn')).toBeHidden();
  });
});
