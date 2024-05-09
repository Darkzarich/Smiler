/* eslint-disable no-await-in-loop */
/* eslint-disable no-shadow */
// @ts-check

import { expect } from '@playwright/test';
import generateAuth from './factory/auth';
import generatePost from './factory/post';
import generateProfile from './factory/profile';
import test from './page-objects';
import Post from './page-objects/components/Post';

const post = generatePost({
  id: '1',
});

const testUser = generateProfile();
const auth = generateAuth();

test.use({
  Post: async ({ page, isMobile }, use) => {
    await use(new Post(page, isMobile));
  },
});

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

test('Goes to 404 if user does not exist', async ({
  ProfilePage,
  NotFoundPage,
  page: currentPage,
  SystemNotification,
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
  await expect(SystemNotification.list).toContainText('User was not found');
});

test('Fetches and shows user profile', async ({ ProfilePage, Api }) => {
  const userResponse = await Api.routes.users.getUserProfile.waitForRequest({
    beforeAction: async () => {
      await ProfilePage.goto(testUser.login);
    },
  });

  expect(userResponse.url()).toContain(`/users/${testUser.login}`);
  await expect(ProfilePage.page).toHaveTitle(
    ProfilePage.getTitle(testUser.login),
  );
  await expect(ProfilePage.login).toContainText(testUser.login);
  await expect(ProfilePage.rating).toContainText(testUser.rating.toString());
  await expect(ProfilePage.followers).toContainText(
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
    beforeAction: async () => {
      await ProfilePage.goto(testUser.login);
    },
  });

  expect(postResponse.url()).toContain(
    `author=${testUser.login}&limit=20&offset=0`,
  );

  await expect(Post.getTitleById(post.id)).toContainText(post.title);
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
    ProfilePage,
    Api,
  }) => {
    await ProfilePage.goto(testUser.login);

    const followResponse = await Api.routes.users.followUser.waitForRequest({
      beforeAction: ProfilePage.follow.bind(ProfilePage),
    });

    expect(followResponse.url()).toContain(testUser.id);
    await expect(ProfilePage.unfollowBtn).toBeVisible();
    await expect(ProfilePage.followers).toContainText(
      (testUser.followersAmount + 1).toString(),
    );
  });

  test('Unfollows a followed user, followers count decreases', async ({
    ProfilePage,
    Api,
  }) => {
    Api.routes.users.getUserProfile.mock({
      body: generateProfile({
        followersAmount: testUser.followersAmount + 1,
        isFollowed: true,
      }),
    });

    await ProfilePage.goto(testUser.login);

    const unfollowResponse = await Api.routes.users.unfollowUser.waitForRequest(
      {
        beforeAction: ProfilePage.unfollow.bind(ProfilePage),
      },
    );

    expect(unfollowResponse.url()).toContain(testUser.id);
    await expect(ProfilePage.followBtn).toBeVisible();
    await expect(ProfilePage.followers).toContainText('0');
  });

  test('Cannot follow or unfollow yourself', async ({ ProfilePage, Api }) => {
    Api.routes.auth.getAuth.mock({
      body: generateAuth({
        isAuth: true,
      }),
    });

    await ProfilePage.goto(testUser.login);

    await expect(ProfilePage.followBtn).toBeHidden();
    await expect(ProfilePage.unfollowBtn).toBeHidden();
  });
});
