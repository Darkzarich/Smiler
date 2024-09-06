/* eslint-disable no-await-in-loop */
/* eslint-disable no-shadow */

import { expect } from '@playwright/test';
import createRandomAuth from './factory/auth';
import createRandomPost from './factory/post';
import createRandomProfile from './factory/profile';
import test from './page-objects';

const post = createRandomPost();

const testUser = createRandomProfile();

const auth = createRandomAuth();

test.beforeEach(async ({ Api }) => {
  Api.routes.auth.getAuth.mock({
    body: auth,
  });

  Api.routes.posts.getPosts.mock({
    body: {
      pages: 1,
      posts: [post],
      hasNextPage: false,
      total: 1,
    },
  });

  Api.routes.users.getUserProfile.mock({
    body: testUser,
  });
});

test('Goes to 404 if user does not exist', async ({
  ProfilePage,
  NotFoundPage,
  page: currentPage,
  NotificationList,
  Api,
}) => {
  Api.routes.users.getUserProfile.mock({
    status: 404,
    body: {
      error: {
        message: 'User was not found',
      },
    },
  });

  await ProfilePage.goto('non-existing-user');

  await NotFoundPage.waitForNotFoundPage();
  await expect(currentPage).toHaveTitle(NotFoundPage.title);
  await expect(NotificationList.root).toContainText('User was not found');
});

test('Fetches and shows user profile', async ({ ProfilePage, Api }) => {
  const userResponse = await Api.routes.users.getUserProfile.waitForRequest({
    preRequestAction: async () => {
      await ProfilePage.goto(testUser.login);
    },
  });

  expect(userResponse.url()).toContain(`/users/${testUser.login}`);
  await expect(ProfilePage.page).toHaveTitle(
    ProfilePage.getTitle(testUser.login),
  );
  await expect(ProfilePage.login).toContainText(testUser.login);
  await expect(ProfilePage.rating).toContainText(testUser.rating.toString());
  await expect(ProfilePage.followersCount).toContainText(
    testUser.followersAmount.toString(),
  );
  await expect(ProfilePage.bio).toContainText(testUser.bio);
  await expect(ProfilePage.unfollowBtn).toBeHidden();
  await expect(ProfilePage.followBtn).toBeHidden();
});

test('Fetches user posts with expected filters', async ({
  ProfilePage,
  Post,
  Api,
}) => {
  const postResponse = await Api.routes.posts.getPosts.waitForRequest({
    preRequestAction: async () => {
      await ProfilePage.goto(testUser.login);
    },
  });

  expect(postResponse.url()).toContain(
    `author=${testUser.login}&limit=15&offset=0`,
  );

  await expect(Post.getTitleById(post.id)).toContainText(post.title);
});

test.describe('Follows and unfollow', () => {
  test.beforeEach(async ({ Api }) => {
    Api.routes.auth.getAuth.mock({
      body: createRandomAuth({
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

  test('Follows another user, followers count increases', async ({
    ProfilePage,
    Post,
    Api,
  }) => {
    const notFollowedUser = createRandomProfile({
      isFollowed: false,
    });

    Api.routes.users.getUserProfile.mock({
      body: notFollowedUser,
    });

    await ProfilePage.goto(notFollowedUser.login);

    await Post.getTitleById(post.id);

    const followResponse = await Api.routes.users.followUser.waitForRequest({
      preRequestAction: ProfilePage.follow.bind(ProfilePage),
    });

    expect(followResponse.url()).toContain(notFollowedUser.id);
    await expect(ProfilePage.unfollowBtn).toBeVisible();
    await expect(ProfilePage.followersCount).toContainText(
      (notFollowedUser.followersAmount + 1).toString(),
    );
  });

  test('Unfollows a followed user, followers count decreases', async ({
    ProfilePage,
    Api,
  }) => {
    const followedUser = createRandomProfile({
      isFollowed: true,
    });

    Api.routes.users.getUserProfile.mock({
      body: followedUser,
    });

    await ProfilePage.goto(followedUser.login);

    const unfollowResponse = await Api.routes.users.unfollowUser.waitForRequest(
      {
        preRequestAction: ProfilePage.unfollow.bind(ProfilePage),
      },
    );

    expect(unfollowResponse.url()).toContain(followedUser.id);
    await expect(ProfilePage.followBtn).toBeVisible();
    await expect(ProfilePage.followersCount).toContainText(
      (followedUser.followersAmount - 1).toString(),
    );
  });

  test('Cannot follow or unfollow yourself', async ({ ProfilePage, Api }) => {
    const auth = createRandomAuth({
      isAuth: true,
    });

    Api.routes.users.getUserProfile.mock({
      body: createRandomProfile({
        login: auth.login,
      }),
    });

    Api.routes.auth.getAuth.mock({
      body: auth,
    });

    await ProfilePage.goto(testUser.login);

    await expect(ProfilePage.followBtn).toBeHidden();
    await expect(ProfilePage.unfollowBtn).toBeHidden();
  });

  test('Cannot follow or unfollow if not logged in', async ({
    ProfilePage,
    Api,
  }) => {
    Api.routes.auth.getAuth.mock({
      body: createRandomAuth({
        isAuth: false,
      }),
    });

    await ProfilePage.goto(testUser.login);

    await expect(ProfilePage.followBtn).toBeHidden();
    await expect(ProfilePage.unfollowBtn).toBeHidden();
  });
});
