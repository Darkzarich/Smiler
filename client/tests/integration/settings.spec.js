import { expect } from '@playwright/test';
import generateAuth from './factory/auth';
import generateProfile from './factory/profile';
import test from './page-objects';

const testUser = generateAuth({
  isAuth: true,
});

const author1 = generateProfile({
  id: '1',
  login: 'author1',
});
const author2 = generateProfile({
  id: '2',
  login: 'author2',
});

const authors = [author1, author2];
const tags = ['tag1', 'tag2', 'tag3'];

test.beforeEach(async ({ Api }) => {
  Api.routes.users.checkAuthState.mock({
    body: testUser,
  });

  Api.routes.users.getUsersFollowing.mock({
    body: {
      authors,
      tags,
    },
  });
});

test('Only authenticated user can see Settings page', async ({ page, Api }) => {
  Api.routes.users.checkAuthState.mock({
    body: generateAuth({
      isAuth: false,
    }),
  });

  await page.goto('/user/settings');

  await expect(page.getByTestId('system-notification')).toContainText(
    'Only authenticated users can access this page.',
  );
  await expect(page).toHaveURL('/');
  await expect(page).toHaveTitle('Home | Smiler');
});

test('Open settings page, shows expected authors and tags the user is following', async ({
  page,
  Api,
}) => {
  await Api.routes.users.getUsersFollowing.waitForRequest({
    beforeAction: async () => {
      await page.goto('/user/settings');
    },
  });

  for (const author of authors) {
    // eslint-disable-next-line no-await-in-loop
    await expect(
      page.getByTestId(`user-settings-author-${author.id}`),
    ).toContainText(author.login);
  }

  for (const tag of tags) {
    // eslint-disable-next-line no-await-in-loop
    await expect(page.getByTestId(`user-settings-tags-${tag}`)).toContainText(
      tag,
    );
  }

  await expect(page.getByTestId('user-settings-no-following')).toBeHidden();
  await expect(page).toHaveTitle('Settings | Smiler');
});

test('Shows empty list of authors and tags if the user is not following any', async ({
  page,
  Api,
}) => {
  Api.routes.users.getUsersFollowing.mock({
    body: {
      authors: [],
      tags: [],
    },
  });

  await page.goto('/user/settings');

  await expect(page.getByTestId('user-settings-no-following')).toBeVisible();
});

test('Unfollows an author, removes that author from the list of following', async ({
  page,
  Api,
}) => {
  Api.routes.users.unfollowUser.mock({
    body: {
      ok: true,
    },
  });

  await page.goto('/user/settings');

  await Api.routes.users.unfollowUser.waitForRequest({
    beforeAction: async () => {
      await page
        .getByTestId(`user-settings-author-${author1.id}-unfollow`)
        .click();
    },
  });

  await expect(
    page.getByTestId(`user-settings-author-${author1.id}`),
  ).toBeHidden();
});

test('Unfollows a tag, removes that tag from the list of following', async ({
  page,
  Api,
}) => {
  Api.routes.tags.unfollow.mock({
    body: {
      ok: true,
    },
  });

  await page.goto('/user/settings');

  await Api.routes.tags.unfollow.waitForRequest({
    beforeAction: async () => {
      await page.getByTestId(`user-settings-tag-${tags[0]}-unfollow`).click();
    },
  });

  await expect(page.getByTestId(`user-settings-tag-${tags[0]}`)).toBeHidden();
});

test("Edits current user's bio with expected request body", async ({
  page,
  Api,
}) => {
  await page.goto('/user/settings');

  await page.getByTestId('user-settings-bio-input').fill('New bio');

  const editResponse = await Api.routes.users.updateUserProfile.waitForRequest({
    beforeAction: async () => {
      await page.getByTestId('user-settings-bio-submit').click();
    },
  });

  expect(editResponse.postDataJSON()).toMatchObject({ bio: 'New bio' });
});

test("Edits current user's avatar with expected request body", async ({
  page,
  Api,
}) => {
  await page.goto('/user/settings');

  await page
    .getByTestId('user-settings-avatar-input')
    .fill('https://placehold.co/128x128');

  const editResponse = await Api.routes.users.updateUserProfile.waitForRequest({
    beforeAction: async () => {
      await page.getByTestId('user-settings-avatar-submit').click();
    },
  });

  expect(editResponse.postDataJSON()).toMatchObject({
    avatar: 'https://placehold.co/128x128',
  });
});

test('If typed more than 300 symbols in bio shows validation error and blocks submit', async ({
  page,
}) => {
  await page.goto('/user/settings');

  await page.getByTestId('user-settings-bio-input').fill('t'.repeat(301));

  await expect(page.getByTestId('user-settings-bio-input-error')).toHaveText(
    'Bio is too long',
  );
  await expect(page.getByTestId('user-settings-bio-submit')).toBeDisabled();
});
