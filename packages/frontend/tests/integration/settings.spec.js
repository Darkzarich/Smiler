import { expect } from '@playwright/test';
import createRandomAuth from './factory/auth';
import createRandomProfile from './factory/profile';
import test from './page-objects';

const testUser = createRandomAuth({
  isAuth: true,
});

const author1 = createRandomProfile();
const author2 = createRandomProfile();

const authors = [author1, author2];
const tags = ['tag1', 'tag2', 'tag3'];

test.beforeEach(async ({ Api }) => {
  Api.routes.auth.getAuth.mock({
    body: testUser,
  });

  Api.routes.users.getUserSettings.mock({
    body: {
      authors,
      tags,
      bio: '',
      avatar: '',
    },
  });

  Api.routes.users.updateUserProfile.mock({
    body: {
      ok: true,
    },
  });
});

test("Only authenticated user can see Settings page, redirect to the today's posts page", async ({
  Api,
  page: currentPage,
  SettingsPage,
  PostsPage,
  NotificationList,
}) => {
  Api.routes.auth.getAuth.mock({
    body: createRandomAuth({
      isAuth: false,
    }),
  });

  await SettingsPage.goto();

  await expect(NotificationList.root).toContainText(
    NotificationList.pageNoAccessText,
  );
  await expect(currentPage).toHaveURL(PostsPage.urls.today);
  await expect(currentPage).toHaveTitle(PostsPage.titles.today);
});

test('Open settings page, shows expected authors and tags the user is following', async ({
  Api,
  SettingsPage,
}) => {
  await Api.routes.users.getUserSettings.waitForRequest({
    preRequestAction: async () => {
      await SettingsPage.goto();
    },
  });

  for (const author of authors) {
    // eslint-disable-next-line no-await-in-loop
    await expect(SettingsPage.getAuthorById(author.id)).toContainText(
      author.login,
    );
  }

  for (const tag of tags) {
    // eslint-disable-next-line no-await-in-loop
    await expect(SettingsPage.getTagByText(tag)).toContainText(tag);
  }

  await expect(SettingsPage.noSubscriptionsBlock).toBeHidden();
  await expect(SettingsPage.page).toHaveURL(SettingsPage.url);
  await expect(SettingsPage.page).toHaveTitle(SettingsPage.title);
});

test('Shows empty list of authors and tags if the user is not following any', async ({
  Api,
  SettingsPage,
}) => {
  Api.routes.users.getUserSettings.mock({
    body: {
      authors: [],
      tags: [],
      bio: '',
      avatar: '',
    },
  });

  await SettingsPage.goto();

  await expect(SettingsPage.noSubscriptionsBlock).toBeVisible();
});

test('Unfollows an author, removes that author from the list of following', async ({
  Api,
  SettingsPage,
  NotificationList,
}) => {
  Api.routes.users.unfollowUser.mock({
    body: {
      ok: true,
    },
  });

  await SettingsPage.goto();

  await Api.routes.users.unfollowUser.waitForRequest({
    preRequestAction: async () => {
      await SettingsPage.unfollowAuthor(author1.id);
    },
  });

  await expect(SettingsPage.getAuthorById(author1.id)).toBeHidden();
  await expect(NotificationList.root).toHaveText(
    'This author was successfully unfollowed!',
  );
});

test('Unfollows a tag, removes that tag from the list of following', async ({
  Api,
  SettingsPage,
  NotificationList,
}) => {
  Api.routes.tags.unfollow.mock({
    body: {
      ok: true,
    },
  });

  await SettingsPage.goto();

  await Api.routes.tags.unfollow.waitForRequest({
    preRequestAction: async () => {
      await SettingsPage.unfollowTag(tags[0]);
    },
  });

  await expect(SettingsPage.getTagByText(tags[0])).toBeHidden();
  await expect(NotificationList.root).toHaveText(
    'This tag was successfully unfollowed!',
  );
});

test('Shows current bio and avatar', async ({ Api, SettingsPage }) => {
  Api.routes.users.getUserSettings.mock({
    body: {
      authors: [],
      tags: [],
      bio: 'test bio',
      avatar: 'test avatar',
    },
  });

  await SettingsPage.goto();

  await expect(SettingsPage.bioInput).toHaveValue('test bio');
  await expect(SettingsPage.avatarInput).toHaveValue('test avatar');
});

test("Edits current user's bio with expected request body", async ({
  Api,
  SettingsPage,
  NotificationList,
}) => {
  await SettingsPage.goto();

  await SettingsPage.bioInput.fill('New bio');

  const editResponse = await Api.routes.users.updateUserProfile.waitForRequest({
    preRequestAction: SettingsPage.submitBio.bind(SettingsPage),
  });

  expect(editResponse.postDataJSON()).toMatchObject({ bio: 'New bio' });
  await expect(NotificationList.root).toHaveText(
    'Your bio has been successfully updated!',
  );
});

test("Edits current user's avatar with expected request body", async ({
  Api,
  SettingsPage,
  NotificationList,
}) => {
  await SettingsPage.goto();

  await SettingsPage.avatarInput.fill(SettingsPage.avatarPlaceholderUrl);

  const editResponse = await Api.routes.users.updateUserProfile.waitForRequest({
    preRequestAction: SettingsPage.submitAvatar.bind(SettingsPage),
  });

  expect(editResponse.postDataJSON()).toMatchObject({
    avatar: SettingsPage.avatarPlaceholderUrl,
  });
  await expect(NotificationList.root).toHaveText(
    'Your avatar has been successfully updated!',
  );
});

test('If typed more than 300 symbols in bio shows validation error and blocks submit', async ({
  SettingsPage,
}) => {
  const longText = 't'.repeat(301);

  await SettingsPage.goto();

  await SettingsPage.bioInput.fill(longText);

  await expect(SettingsPage.bioError).toHaveText('Bio is too long');
  await expect(SettingsPage.bioSubmitBtn).toBeDisabled();
});
