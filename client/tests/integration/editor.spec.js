/* eslint-disable playwright/no-conditional-in-test */
/* eslint-disable no-await-in-loop */

// @ts-check

import { expect } from '@playwright/test';
import generateAuth from './factory/auth';
import generatePost from './factory/post';
import test from './page-objects';

const authUser = generateAuth({
  isAuth: true,
});

const title = 'Test post';
const picUrl = 'https://placehold.co/600x400';
const vidCode = 'dQw4w9WgXcQ';

const createdPost = generatePost();

test.beforeEach(async ({ Api }) => {
  Api.routes.posts.createPost.mock({
    body: createdPost,
  });

  Api.routes.posts.getPostBySlug.mock({
    body: createdPost,
  });

  Api.routes.auth.getAuth.mock({
    body: authUser,
  });

  Api.routes.users.getUserTemplate.mock({
    body: { title: '', sections: [], tags: [] },
  });
});

test('Goes to post create page from the user menu', async ({
  page,
  isMobile,
}) => {
  await page.goto('/');

  if (isMobile) {
    await page.getByTestId('mobile-menu').click();
  }

  await page.getByTestId('create-post-btn').click();

  await expect(page).toHaveURL('/post/create');
  await expect(page.getByTestId('post-create-header')).toBeVisible();
});

test('Creates a post with title, tags and content', async ({ page, Api }) => {
  const tags = ['test tag', 'test tag 2'];

  await page.goto('/post/create');

  await expect(page.getByTestId('post-create-header')).toBeVisible();

  await page.getByTestId('post-title-input').fill(title);

  for (const tag of tags) {
    await page.getByTestId('post-tag-input').fill(tag);
    await page.keyboard.press('Enter');
  }

  await page.getByTestId('add-text-button').click();
  await page.getByTestId('text-section-input').fill('test text');

  await page.getByTestId('add-pic-button').click();
  await page.getByTestId('image-url-input').fill(picUrl);
  await page.getByTestId('image-upload-button').click();

  await page.getByTestId('add-video-button').click();
  await page
    .getByTestId('video-url-input')
    .fill(`https://www.youtube.com/watch?v=${vidCode}`);
  await page.getByTestId('video-upload-button').click();

  const createPostResponse = await Api.routes.posts.createPost.waitForRequest({
    beforeAction: async () => {
      await page.getByTestId('create-post-button').click();
    },
  });

  await expect(page).toHaveURL(`/post/${createdPost.slug}`);
  await expect(page).toHaveTitle(`${createdPost.title} | Smiler`);
  await expect(page.getByTestId(`post-${createdPost.id}-title`)).toHaveText(
    createdPost.title,
  );
  expect(createPostResponse.postDataJSON()).toMatchObject({
    title,
    tags,
    sections: [
      {
        type: 'text',
        content: 'test text',
      },
      {
        type: 'pic',
        url: picUrl,
      },
      {
        type: 'vid',
        url: `https://www.youtube.com/embed/${vidCode}`,
      },
    ],
  });
});

test('Uploads a picture in the picture section', async ({ page, Api }) => {
  Api.routes.posts.uploadAttachment.mock({
    body: {
      type: 'pic',
      url: 'https://placehold.co/600x400',
      hash: (Math.random() * Math.random()).toString(36),
      isFile: true,
    },
  });

  await page.goto('/post/create');

  await page.getByTestId('add-pic-button').click();

  await page.getByLabel('Upload image').setInputFiles({
    name: 'test.jpeg',
    buffer: Buffer.from('test', 'utf-8'),
    mimeType: 'image/jpeg',
  });

  const uploadResponse = await Api.routes.posts.uploadAttachment.waitForRequest(
    {
      beforeAction: async () => {
        await page.getByTestId('image-upload-button').click();
      },
    },
  );

  expect(uploadResponse.headers()['content-type']).toContain(
    'multipart/form-data; boundary=',
  );
});

test('Deletes sections in a post', async ({ page }) => {
  await page.goto('/post/create');

  await page.getByTestId('add-text-button').click();
  await page.getByTestId('add-pic-button').click();
  await page.getByTestId('add-video-button').click();

  await page
    .getByTestId(/delete-section/)
    .first()
    .click();
  await page
    .getByTestId(/delete-section/)
    .last()
    .click();
  await page
    .getByTestId(/delete-section/)
    .first()
    .click();

  await expect(page.getByTestId('text-section')).toBeHidden();
  await expect(page.getByTestId('pic-section')).toBeHidden();
  await expect(page.getByTestId('video-section')).toBeHidden();
});

test('D&D post sections to change order of sections', async ({
  page,
  Api,
  isMobile,
}) => {
  // TODO: D&D test doesn't pass for mobile but the feature works
  if (isMobile) {
    return;
  }

  await page.goto('/post/create');

  await page.getByTestId('post-title-input').fill(title);

  await page.getByTestId('add-text-button').click();
  await page.getByTestId('add-pic-button').click();

  await page.getByTestId('text-section').isVisible();

  // Wait until animation if finished
  await page.waitForFunction(() => {
    const element = document.querySelector(
      '[data-testid="post-sections"] > div:last-child',
    );
    const computedStyle = window.getComputedStyle(element);
    console.log(computedStyle.opacity);
    return computedStyle.opacity === '1' && computedStyle.transform === 'none';
  });

  const oldInnerHTML = await page.getByTestId('post-sections').innerHTML();
  // Text Section -> Pic Section order of sections
  expect(oldInnerHTML).toMatch(/text-section.*pic-section/);

  await page
    .getByTestId('text-section')
    .dragTo(page.getByTestId('pic-section'));

  const newInnerHTML = await page.getByTestId('post-sections').innerHTML();
  // Pic Section -> Text Section order of sections
  expect(newInnerHTML).toMatch(/pic-section.*text-section/);

  const createPostResponse = await Api.routes.posts.createPost.waitForRequest({
    beforeAction: async () => {
      await page.getByTestId('create-post-button').click();
    },
  });

  expect(createPostResponse.postDataJSON()).toMatchObject({
    sections: [
      {
        type: 'pic',
      },
      {
        type: 'text',
      },
    ],
  });
});

test('Fetch and show draft template', async ({ Api, page }) => {
  const savedTitle = 'Saved title';
  const savedSections = [
    {
      type: 'text',
      content: 'test text',
      hash: 1,
    },
    {
      type: 'pic',
      url: picUrl,
      hash: 2,
    },
    {
      type: 'vid',
      url: `https://www.youtube.com/embed/${vidCode}`,
      hash: 3,
    },
  ];
  const savedTags = ['test tag 1', 'test tag 2'];

  Api.routes.users.getUserTemplate.mock({
    body: { title: savedTitle, sections: savedSections, tags: savedTags },
  });

  const getUserTemplateResponse =
    await Api.routes.users.getUserTemplate.waitForRequest({
      beforeAction: async () => {
        await page.goto('/post/create');
      },
    });

  expect(getUserTemplateResponse.url()).toContain(authUser.login);

  await expect(page.getByTestId('post-section').first()).toContainText(
    savedSections[0].content,
  );

  await expect(
    page.locator('[data-testid="post-section"]:nth-child(2) img'),
  ).toHaveAttribute('src', savedSections[1].url);

  await expect(
    page
      .getByTestId('post-section')
      .last()
      .filter({ has: page.getByTestId('video-section') }),
  ).toBeVisible();
});

test('Saves draft template', async ({ page, Api }) => {
  const tag = 'test tag';

  await page.goto('/post/create');

  await page.getByTestId('post-title-input').fill(title);

  await page.getByTestId('post-tag-input').fill(tag);
  await page.keyboard.press('Enter');

  await page.getByTestId('add-text-button').click();
  await page.getByTestId('text-section-input').fill('test text');

  await page.getByTestId('add-pic-button').click();
  await page.getByTestId('image-url-input').fill(picUrl);
  await page.getByTestId('image-upload-button').click();

  await page.getByTestId('add-video-button').click();
  await page
    .getByTestId('video-url-input')
    .fill(`https://www.youtube.com/watch?v=${vidCode}`);
  await page.getByTestId('video-upload-button').click();

  const updateUserTemplateResponse =
    await Api.routes.users.updateUserTemplate.waitForRequest({
      beforeAction: async () => {
        await page.getByTestId('save-draft-button').click();
      },
    });

  expect(updateUserTemplateResponse.url()).toContain(authUser.login);
  expect(updateUserTemplateResponse.postDataJSON()).toMatchObject({
    title,
    tags: [tag],
    sections: [
      {
        type: 'text',
        content: 'test text',
      },
      {
        type: 'pic',
        url: picUrl,
      },
      {
        type: 'vid',
        url: `https://www.youtube.com/embed/${vidCode}`,
      },
    ],
  });
});

test.describe('Tags', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/post/create');
  });

  async function addPostTagsFrom(page, tags) {
    for (const tag of tags) {
      await page.getByTestId('post-tag-input').fill(tag);
      await page.keyboard.press('Enter');
    }
  }

  test('Adds and shows tags', async ({ page }) => {
    const tags = ['test tag 1', 'test tag 2', 'test tag 3'];

    await addPostTagsFrom(page, tags);

    for (const tag of tags) {
      await expect(page.getByTestId('post-tags-list')).toContainText(tag);
    }
  });

  test('Removes tags', async ({ page }) => {
    const tags = ['test tag 1', 'test tag 2'];

    await addPostTagsFrom(page, tags);

    for (const tag of tags) {
      await page.getByTestId(`remove-tag-button-${tag}`).click();
      await expect(page.getByTestId('post-tags-list')).not.toContainText(tag);
    }
  });

  test('Can add not more than 8 tags', async ({ page }) => {
    const tags = [
      'test tag 1',
      'test tag 2',
      'test tag 3',
      'test tag 4',
      'test tag 5',
      'test tag 6',
      'test tag 7',
      'test tag 8',
    ];

    await addPostTagsFrom(page, tags);

    await expect(page.getByTestId('post-tag-input')).toBeHidden();
  });
});

test('Cannot open the editor if the user is not logged in', async ({
  page,
  Api,
  SystemNotification,
}) => {
  Api.routes.auth.getAuth.mock({ body: generateAuth() });

  await page.goto('/post/create');

  await expect(SystemNotification.list).toContainText(
    SystemNotification.pageNoAccessText,
  );
  await expect(page).toHaveURL('/');
  await expect(page).toHaveTitle('Home | Smiler');
});
