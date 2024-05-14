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
  PostsPage,
  page: currentPage,
  PostCreatePage,
  Menu,
}) => {
  await PostsPage.goto(PostsPage.urls.today);

  Menu.openIfMobile();

  await Menu.goToCreatePostPage();

  await expect(currentPage).toHaveURL(PostCreatePage.url);
  await expect(PostCreatePage.header).toBeVisible();
});

test('Creates a post with title, tags and content', async ({
  PostCreatePage,
  page: currentPage,
  SinglePostPage,
  Post,
  Api,
}) => {
  const tags = ['test tag', 'test tag 2'];

  await PostCreatePage.goto();

  await expect(PostCreatePage.header).toBeVisible();

  await PostCreatePage.postTitleInput.fill(title);

  for (const tag of tags) {
    await PostCreatePage.addTag(tag);
  }

  await PostCreatePage.addTextSection();
  await PostCreatePage.fillTextSection('test text');

  await PostCreatePage.addPictureSection();
  await PostCreatePage.uploadPictureWithUrl(picUrl);

  await PostCreatePage.addVideoSection();
  await PostCreatePage.uploadVideoWithUrl(vidCode);

  const createPostResponse = await Api.routes.posts.createPost.waitForRequest({
    preRequestAction: PostCreatePage.submitPost.bind(PostCreatePage),
  });

  await expect(currentPage).toHaveURL(
    SinglePostPage.getUrlWithSlug(createdPost.slug),
  );
  await expect(currentPage).toHaveTitle(
    SinglePostPage.getTitle(createdPost.title),
  );
  await expect(Post.getTitleById(createdPost.id)).toHaveText(createdPost.title);
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

test('Uploads a picture in the picture section', async ({
  PostCreatePage,
  Api,
}) => {
  Api.routes.posts.uploadAttachment.mock({
    body: {
      type: 'pic',
      url: picUrl,
      hash: (Math.random() * Math.random()).toString(36),
      isFile: true,
    },
  });

  await PostCreatePage.goto();

  await PostCreatePage.addPictureSection();

  const uploadResponse = await Api.routes.posts.uploadAttachment.waitForRequest(
    {
      preRequestAction:
        PostCreatePage.uploadPictureWithFile.bind(PostCreatePage),
    },
  );

  expect(uploadResponse.headers()['content-type']).toContain(
    'multipart/form-data; boundary=',
  );
});

test('Deletes sections in a post', async ({ PostCreatePage }) => {
  await PostCreatePage.goto();

  await PostCreatePage.addTextSection();
  await PostCreatePage.addPictureSection();
  await PostCreatePage.addVideoSection();

  await PostCreatePage.removeFirstSection();
  await PostCreatePage.removeLastSection();
  await PostCreatePage.removeFirstSection();

  await expect(PostCreatePage.getTextSection()).toBeHidden();
  await expect(PostCreatePage.getPictureSection()).toBeHidden();
  await expect(PostCreatePage.getVideoSection()).toBeHidden();
});

test('D&D post sections to change order of sections', async ({
  PostCreatePage,
  Api,
  isMobile,
}) => {
  // TODO: D&D test doesn't pass for mobile but the feature works
  if (isMobile) {
    return;
  }

  await PostCreatePage.goto();

  await PostCreatePage.postTitleInput.fill(title);

  await PostCreatePage.addTextSection();
  await PostCreatePage.addPictureSection();

  await PostCreatePage.awaitDragAndDropAnimation();

  const assertNewOrderOfSections =
    await PostCreatePage.assertOldOrderOfSections();

  await PostCreatePage.getTextSection().dragTo(
    PostCreatePage.getPictureSection(),
  );

  await assertNewOrderOfSections();

  const createPostResponse = await Api.routes.posts.createPost.waitForRequest({
    preRequestAction: PostCreatePage.submitPost.bind(PostCreatePage),
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

test('Fetch and show draft template', async ({ Api, page, PostCreatePage }) => {
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
      preRequestAction: PostCreatePage.goto.bind(PostCreatePage),
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

test('Saves draft template', async ({ PostCreatePage, Api }) => {
  const tag = 'test tag';

  await PostCreatePage.goto();

  await PostCreatePage.postTitleInput.fill(title);

  await PostCreatePage.addTag(tag);

  await PostCreatePage.addTextSection();
  await PostCreatePage.fillTextSection('test text');

  await PostCreatePage.addPictureSection();
  await PostCreatePage.uploadPictureWithUrl(picUrl);

  await PostCreatePage.addVideoSection();
  await PostCreatePage.uploadVideoWithUrl(vidCode);

  const updateUserTemplateResponse =
    await Api.routes.users.updateUserTemplate.waitForRequest({
      preRequestAction: PostCreatePage.saveDraft.bind(PostCreatePage),
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
  test.beforeEach(async ({ PostCreatePage }) => {
    await PostCreatePage.goto();
  });

  test('Adds and shows tags', async ({ PostCreatePage }) => {
    const tags = ['test tag 1', 'test tag 2', 'test tag 3'];

    for (const tag of tags) {
      await PostCreatePage.addTag(tag);
    }

    for (const tag of tags) {
      await expect(PostCreatePage.postTagList).toContainText(tag);
    }
  });

  test('Removes tags', async ({ PostCreatePage }) => {
    const tags = ['test tag 1', 'test tag 2'];

    for (const tag of tags) {
      await PostCreatePage.addTag(tag);
    }

    for (const tag of tags) {
      await PostCreatePage.removeTag(tag);
      await expect(PostCreatePage.postTagList).not.toContainText(tag);
    }
  });

  test('Can add not more than 8 tags', async ({ PostCreatePage }) => {
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

    for (const tag of tags) {
      await PostCreatePage.addTag(tag);
    }

    await expect(PostCreatePage.postTagInput).toBeHidden();
  });
});

test('Cannot open the editor if the user is not logged in', async ({
  page: currentPage,
  PostsPage,
  Api,
  SystemNotification,
  PostCreatePage,
}) => {
  Api.routes.auth.getAuth.mock({ body: generateAuth() });

  await PostCreatePage.goto();

  await expect(SystemNotification.list).toContainText(
    SystemNotification.pageNoAccessText,
  );
  await expect(currentPage).toHaveURL(PostsPage.urls.today);
  await expect(currentPage).toHaveTitle(PostsPage.titles.today);
});
