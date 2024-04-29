import { test, expect } from '@playwright/test';
import generateAuth from './factory/auth';
import generateProfile from './factory/profile';

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

test.beforeEach(async ({ context }) => {
  await context.route('*/**/users/get-auth', async (route) => {
    route.fulfill({
      json: testUser,
    });
  });

  await context.route('*/**/users/me/following', async (route) => {
    route.fulfill({
      json: {
        authors,
        tags,
      },
    });
  });
});

test('Only authenticated user can see Settings page', async ({
  page,
  context,
}) => {
  await context.route('*/**/users/get-auth', async (route) => {
    route.fulfill({
      json: generateAuth({
        isAuth: false,
      }),
    });
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
}) => {
  const getFollowingRequest = page.waitForRequest('*/**/users/me/following');

  await page.goto('/user/settings');

  await getFollowingRequest;

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
  context,
}) => {
  await context.route('*/**/users/me/following', async (route) => {
    route.fulfill({
      json: {
        authors: [],
        tags: [],
      },
    });
  });

  await page.goto('/user/settings');

  await expect(page.getByTestId('user-settings-no-following')).toBeVisible();
});

test('Unfollows an author, removes that author from the list of following', async ({
  page,
  context,
}) => {
  await context.route(`**/users/${author1.id}/follow`, async (route) => {
    await route.fulfill({
      json: {
        ok: true,
      },
    });
  });

  await page.goto('/user/settings');

  const unfollowRequest = page.waitForRequest(
    (res) =>
      res.url().includes(`/users/${author1.id}/follow`) &&
      res.method() === 'DELETE',
  );

  await page.getByTestId(`user-settings-author-${author1.id}-unfollow`).click();

  await unfollowRequest;

  await expect(
    page.getByTestId(`user-settings-author-${author1.id}`),
  ).toBeHidden();
});

test('Unfollows a tag, removes that tag from the list of following', async ({
  page,
  context,
}) => {
  await context.route(`**/tags/${tags[0]}/follow`, async (route) => {
    await route.fulfill({
      json: {
        ok: true,
      },
    });
  });

  await page.goto('/user/settings');

  const unfollowRequest = page.waitForRequest(
    (res) =>
      res.url().includes(`/tags/${tags[0]}/follow`) &&
      res.method() === 'DELETE',
  );

  await page.getByTestId(`user-settings-tag-${tags[0]}-unfollow`).click();

  await unfollowRequest;

  await expect(page.getByTestId(`user-settings-tag-${tags[0]}`)).toBeHidden();
});

test("Edits current user's bio with expected request body", async ({
  page,
}) => {
  await page.goto('/user/settings');

  const editRequest = page.waitForRequest(
    (res) => res.url().includes('/users/me') && res.method() === 'PUT',
  );

  await page.getByTestId('user-settings-bio-input').fill('New bio');
  await page.getByTestId('user-settings-bio-submit').click();

  const editResponse = await editRequest;

  expect(editResponse.postDataJSON()).toMatchObject({ bio: 'New bio' });
});

test("Edits current user's avatar with expected request body", async ({
  page,
}) => {
  await page.goto('/user/settings');

  const editRequest = page.waitForRequest(
    (res) => res.url().includes('/users/me') && res.method() === 'PUT',
  );

  await page
    .getByTestId('user-settings-avatar-input')
    .fill('https://placehold.co/128x128');
  await page.getByTestId('user-settings-avatar-submit').click();

  const editResponse = await editRequest;

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
