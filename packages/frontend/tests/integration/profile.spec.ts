/* eslint-disable no-await-in-loop */
/* eslint-disable no-shadow */

import { expect } from '@playwright/test';
import { subDays } from 'date-fns';
import test from './page-objects';
import createRandomAuth from '@factory/auth';
import createRandomPost from '@factory/post';
import createRandomProfile from '@factory/profile';

const post = createRandomPost();

const testUser = createRandomProfile();

const auth = createRandomAuth();

test.beforeEach(async ({ Api }) => {
  Api.routes.auth.getAuth.mock({
    body: auth,
  });

  Api.routes.posts.getPosts.mock({
    body: {
      posts: [post],
      hasNextPage: false,
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
  await expect(ProfilePage.followBtn).toBeVisible();
});

test('Shows the new profile after a link from one profile to another', async ({
  page,
  ProfilePage,
  Api,
}) => {
  const me = createRandomAuth({ isAuth: true });

  Api.routes.auth.getAuth.mock({ body: me });

  await ProfilePage.goto(testUser.login);
  await expect(ProfilePage.login).toContainText(testUser.login);

  Api.routes.users.getUserProfile.mock({
    body: createRandomProfile({ login: me.login }),
  });

  // The header avatar links to the signed in user's own profile
  const userRequest = await Api.routes.users.getUserProfile.waitForRequest({
    preRequestAction: async () => {
      await page.locator('header').getByRole('img', { name: 'avatar' }).click();
    },
  });

  expect(userRequest.url()).toContain(`/users/${me.login}`);
  await expect(page).toHaveURL(ProfilePage.getUrlWithLogin(me.login));
  await expect(ProfilePage.login).toContainText(me.login);
});

test('Fits the profile header on a 320px phone', async ({
  page,
  ProfilePage,
  Api,
}) => {
  // The longest login allowed, in the widest letter
  const longUser = createRandomProfile({
    login: 'w'.repeat(15),
    rating: -1234.5,
    followersAmount: 1234,
  });

  Api.routes.users.getUserProfile.mock({ body: longUser });

  await page.setViewportSize({ width: 320, height: 800 });
  await ProfilePage.goto(longUser.login);
  await expect(ProfilePage.followBtn).toBeVisible();

  const card = await page.locator('.user-profile').boundingBox();

  for (const part of [
    ProfilePage.login,
    ProfilePage.rating,
    ProfilePage.followersCount,
    ProfilePage.followBtn,
  ]) {
    const box = await part.boundingBox();

    expect(box!.x).toBeGreaterThanOrEqual(card!.x);
    expect(box!.x + box!.width).toBeLessThanOrEqual(card!.x + card!.width);
  }
});

test.describe('Long offline indicator', () => {
  test('Shows how long the user has been away when they have not signed in for a long time', async ({
    ProfilePage,
    Api,
  }) => {
    // Not 90: the badge counts 30-day months and rounds down, and across a DST
    // change between the runner's timezone and the browser's, 90 days shows as
    // 89 days 23 hours, which is "2 months"
    const awayUser = createRandomProfile({
      lastLoginAt: subDays(new Date(), 100).toISOString(),
    });

    Api.routes.users.getUserProfile.mock({
      body: awayUser,
    });

    await ProfilePage.goto(awayUser.login);

    await expect(ProfilePage.offlineBadge).toContainText(
      'Away · last seen 3 months ago',
    );
  });

  test('Hides the indicator for a user who signed in recently', async ({
    ProfilePage,
    Api,
  }) => {
    const activeUser = createRandomProfile({
      lastLoginAt: subDays(new Date(), 1).toISOString(),
    });

    Api.routes.users.getUserProfile.mock({
      body: activeUser,
    });

    await ProfilePage.goto(activeUser.login);

    await expect(ProfilePage.login).toContainText(activeUser.login);
    await expect(ProfilePage.offlineBadge).toBeHidden();
  });

  test('Hides the indicator for a user with no last login date stored', async ({
    ProfilePage,
  }) => {
    await ProfilePage.goto(testUser.login);

    await expect(ProfilePage.login).toContainText(testUser.login);
    await expect(ProfilePage.offlineBadge).toBeHidden();
  });
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

  // The author's posts page by cursor, so the first page carries neither an
  // offset nor a cursor
  expect(postResponse.url()).toContain(`author=${testUser.login}&limit=15`);
  expect(postResponse.url()).not.toContain('offset');
  expect(postResponse.url()).not.toContain('cursor');

  await expect(Post.getTitleById(post._id)).toContainText(post.title);
});

test.describe('Follows and unfollow', () => {
  test.beforeEach(async ({ Api }) => {
    Api.routes.auth.getAuth.mock({
      body: createRandomAuth({
        isAuth: true,
        _id: `_${testUser._id}`,
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

    await Post.getTitleById(post._id);

    const followResponse = await Api.routes.users.followUser.waitForRequest({
      preRequestAction: ProfilePage.follow.bind(ProfilePage),
    });

    expect(followResponse.url()).toContain(notFollowedUser._id);
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

    expect(unfollowResponse.url()).toContain(followedUser._id);
    await expect(ProfilePage.followBtn).toBeVisible();
    await expect(ProfilePage.followersCount).toContainText(
      (followedUser.followersAmount - 1).toString(),
    );
  });

  test('Reads Following for a followed user, and Unfollow on keyboard focus', async ({
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

    const following = ProfilePage.unfollowBtn.getByText('Following');
    const unfollow = ProfilePage.unfollowBtn.getByText('Unfollow');

    await expect(ProfilePage.unfollowBtn).toHaveAccessibleName('Following');
    await expect(following).toHaveCSS('opacity', '1');
    await expect(unfollow).toHaveCSS('opacity', '0');

    await ProfilePage.unfollowBtn.focus();
    await expect(following).toHaveCSS('opacity', '0');
    await expect(unfollow).toHaveCSS('opacity', '1');
    await expect(ProfilePage.unfollowBtn).toHaveAccessibleName('Following');
  });

  test('Reads Unfollow on the Following button under the mouse', async ({
    page,
    ProfilePage,
    Api,
    isMobile,
  }) => {
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip(isMobile, 'A touch screen has no hover to show it on');

    const followedUser = createRandomProfile({
      isFollowed: true,
    });

    Api.routes.users.getUserProfile.mock({
      body: followedUser,
    });

    await ProfilePage.goto(followedUser.login);

    const following = ProfilePage.unfollowBtn.getByText('Following');
    const unfollow = ProfilePage.unfollowBtn.getByText('Unfollow');

    await ProfilePage.unfollowBtn.hover();
    await expect(following).toHaveCSS('opacity', '0');
    await expect(unfollow).toHaveCSS('opacity', '1');

    await page.mouse.move(0, 0);
    await expect(following).toHaveCSS('opacity', '1');
    await expect(unfollow).toHaveCSS('opacity', '0');
  });

  test('Cannot follow or unfollow yourself', async ({ ProfilePage, Api }) => {
    const auth = createRandomAuth({
      isAuth: true,
    });

    Api.routes.users.getUserProfile.mock({
      body: createRandomProfile({
        _id: auth._id,
      }),
    });

    Api.routes.auth.getAuth.mock({
      body: auth,
    });

    await ProfilePage.goto(testUser.login);

    await expect(ProfilePage.followBtn).toBeHidden();
    await expect(ProfilePage.unfollowBtn).toBeHidden();
  });

  test('Asks a visitor to sign in to follow, then follows', async ({
    ProfilePage,
    AuthPrompt,
    Api,
  }) => {
    Api.routes.auth.getAuth.mock({
      body: createRandomAuth({
        isAuth: false,
      }),
    });

    Api.routes.users.getUserProfile.mock({
      body: { ...testUser, isFollowed: false },
    });

    await ProfilePage.goto(testUser.login);

    await ProfilePage.followBtn.click();

    await expect(AuthPrompt.title).toHaveText(
      `Sign in to follow ${testUser.login}`,
    );

    await Api.routes.auth.signIn.mock({
      body: createRandomAuth({ isAuth: true }),
    });

    const followRequest = await Api.routes.users.followUser.waitForRequest({
      preRequestAction: AuthPrompt.signIn.bind(AuthPrompt),
    });

    expect(followRequest.url()).toContain(testUser._id);
    await expect(ProfilePage.unfollowBtn).toBeVisible();
  });

  test("Shows the account's follow once a visitor signs in from the sidebar", async ({
    ProfilePage,
    Menu,
    AuthForm,
    Api,
  }) => {
    Api.routes.auth.getAuth.mock({ body: createRandomAuth() });
    Api.routes.users.getUserProfile.mock({
      body: { ...testUser, isFollowed: false },
    });

    await ProfilePage.goto(testUser.login);
    await expect(ProfilePage.followBtn).toBeVisible();

    // What the profile says once a session exists
    await Api.routes.users.getUserProfile.mock({
      body: { ...testUser, isFollowed: true },
    });
    await Api.routes.auth.signIn.mock({
      body: createRandomAuth({ isAuth: true }),
    });

    await Menu.openIfMobile();
    await AuthForm.signInEmail.fill('visitor@example.com');
    await AuthForm.signInPassword.fill('password');
    await AuthForm.clickSignInBtn();

    await expect(ProfilePage.unfollowBtn).toBeVisible();
  });

  test('Does not follow again after sign in when the account already follows', async ({
    page: currentPage,
    ProfilePage,
    AuthPrompt,
    Api,
  }) => {
    Api.routes.auth.getAuth.mock({
      body: createRandomAuth({
        isAuth: false,
      }),
    });

    Api.routes.users.getUserProfile.mock({
      body: { ...testUser, isFollowed: false },
    });

    await ProfilePage.goto(testUser.login);
    await ProfilePage.followBtn.click();

    // What the profile says once a session exists
    await Api.routes.users.getUserProfile.mock({
      body: { ...testUser, isFollowed: true },
    });
    await Api.routes.auth.signIn.mock({
      body: createRandomAuth({ isAuth: true }),
    });

    const followRequests: string[] = [];

    currentPage.on('request', (request) => {
      if (request.method() === 'PUT' && request.url().endsWith('/follow')) {
        followRequests.push(request.url());
      }
    });

    await AuthPrompt.signIn();

    await expect(ProfilePage.unfollowBtn).toBeVisible();
    expect(followRequests).toEqual([]);
  });
});

test('Keeps the posts and the place in them on Back from a post', async ({
  page: currentPage,
  ProfilePage,
  Post,
  Api,
}) => {
  const authorPosts = Array.from({ length: 15 }, () => createRandomPost());
  const opened = authorPosts[10]!;
  const postRequests: string[] = [];
  const profileRequests: string[] = [];

  currentPage.on('request', (request) => {
    if (Api.routes.posts.getPosts.getURLRegExp().test(request.url())) {
      postRequests.push(request.url());
    }

    if (Api.routes.users.getUserProfile.getURLRegExp().test(request.url())) {
      profileRequests.push(request.url());
    }
  });

  Api.routes.posts.getPosts.mock({
    body: { posts: authorPosts, hasNextPage: false },
  });
  Api.routes.posts.getPostBySlug.mock({ body: opened });
  Api.routes.comments.getComments.mock({ body: { comments: [] } });

  await ProfilePage.goto(testUser.login);
  await expect(Post.getListedPosts()).toHaveCount(15);
  await Post.scrollPostDownTo(opened._id, 200);

  const top = await Post.getPostTopById(opened._id);

  await Post.openPostById(opened._id);
  await expect(currentPage).toHaveURL(new RegExp(opened.slug));
  await currentPage.goBack();

  await expect(Post.getListedPosts()).toHaveCount(15);
  await expect(ProfilePage.login).toBeVisible();
  await expect
    .poll(async () => Math.abs((await Post.getPostTopById(opened._id))! - top!))
    .toBeLessThanOrEqual(2);
  expect(postRequests).toHaveLength(1);
  // The profile is fetched again for a follow made on the way
  await expect.poll(() => profileRequests.length).toBe(2);
});
