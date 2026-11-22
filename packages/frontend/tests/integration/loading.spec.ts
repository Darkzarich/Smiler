import { expect, type BrowserContext } from '@playwright/test';
import test from './page-objects';
import type Route from './page-objects/api/route';
import createRandomAuth from '@factory/auth';
import createRandomPost from '@factory/post';
import createRandomProfile from '@factory/profile';

/** Answers `route` only once the returned function is called */
async function hold(
  context: BrowserContext,
  route: Route,
  body: object,
): Promise<() => void> {
  let release = () => {};
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });

  await context.route(route.getURLRegExp(), async (pageRoute) => {
    await released;
    await pageRoute.fulfill({ json: body });
  });

  return release;
}

test.beforeEach(async ({ Api }) => {
  Api.routes.posts.getToday.mock({
    body: {
      posts: [],
      hasNextPage: false,
    },
  });
});

test.describe('Loading states', () => {
  test('Paints the header while the session check is pending', async ({
    page,
    context,
    Api,
  }) => {
    const auth = createRandomAuth({ isAuth: true });

    const releaseAuth = await hold(context, Api.routes.auth.getAuth, auth);

    await page.goto('/');

    const header = page.getByRole('banner');

    await expect(header).toBeVisible();
    await expect(header.getByRole('img', { name: 'avatar' })).toBeHidden();

    releaseAuth();

    await expect(header.getByRole('img', { name: 'avatar' })).toBeVisible();
  });

  test('Shows a loader on a post page while the post loads', async ({
    page,
    context,
    Api,
    SinglePostPage,
    Post,
  }) => {
    const post = createRandomPost();

    await Api.routes.auth.getAuth.mock({
      body: createRandomAuth(),
    });
    await Api.routes.comments.getComments.mock({
      body: {
        comments: [],
        hasNextPage: false,
      },
    });

    const releasePost = await hold(
      context,
      Api.routes.posts.getPostBySlug,
      post,
    );

    await SinglePostPage.goto(post.slug);

    await expect(page.getByTestId('post-loading')).toBeVisible();
    await expect(page).toHaveTitle('Post | Smiler');

    releasePost();

    await expect(Post.getTitleById(post._id)).toHaveText(post.title);
    await expect(page.getByTestId('post-loading')).toBeHidden();
    await expect(page).toHaveTitle(SinglePostPage.getTitle(post.title));
  });

  test('Shows a loader on a profile while it loads', async ({
    page,
    context,
    Api,
    ProfilePage,
  }) => {
    const profile = createRandomProfile();

    await Api.routes.auth.getAuth.mock({
      body: createRandomAuth(),
    });
    await Api.routes.posts.getPosts.mock({
      body: {
        posts: [],
        hasNextPage: false,
      },
    });

    const releaseProfile = await hold(
      context,
      Api.routes.users.getUserProfile,
      profile,
    );

    await ProfilePage.goto(profile.login);

    await expect(page.getByTestId('profile-loading')).toBeVisible();

    releaseProfile();

    await expect(ProfilePage.login).toContainText(profile.login);
    await expect(page.getByTestId('profile-loading')).toBeHidden();
  });

  test('Shows a loader on the edit page while the post loads', async ({
    page,
    context,
    Api,
    PostEditPage,
  }) => {
    const auth = createRandomAuth({ isAuth: true });
    const post = createRandomPost({
      author: {
        _id: auth._id,
        login: auth.login,
        avatar: auth.avatar,
      },
      createdAt: new Date().toISOString(),
    });

    await Api.routes.auth.getAuth.mock({ body: auth });

    const releasePost = await hold(
      context,
      Api.routes.posts.getPostBySlug,
      post,
    );

    await PostEditPage.goto(post.slug);

    await expect(page.getByTestId('editor-loading')).toBeVisible();

    releasePost();

    await expect(page.getByTestId('post-title-input')).toHaveValue(post.title);
    await expect(page.getByTestId('editor-loading')).toBeHidden();
  });
});
