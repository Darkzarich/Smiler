/* eslint-disable no-await-in-loop */

import { expect } from '@playwright/test';
import { subMinutes } from 'date-fns';
import createRandomAuth from './factory/auth';
import createRandomComment from './factory/comment';
import createRandomPost from './factory/post';
import createRandomProfile from './factory/profile';
import createRandomSection from './factory/section';
import test from './page-objects';
import mockDate from './utils/mock-date';

const auth = createRandomAuth({
  isAuth: true,
});
const post = createRandomPost();

test.beforeEach(async ({ Api }) => {
  Api.routes.auth.getAuth.mock({
    body: auth,
  });

  Api.routes.posts.getPostBySlug.mock({
    body: post,
  });

  Api.routes.posts.getToday.mock({
    body: {
      pages: 1,
      posts: [post],
      hasNextPage: false,
      total: 1,
    },
  });

  Api.routes.comments.getComments.mock({
    body: {
      pages: 0,
      comments: [createRandomComment()],
    },
  });
});

test.describe('Fetches a post by the slug of the post after clicking it in the list of posts', () => {
  test.beforeEach(async ({ PostsPage }) => {
    await PostsPage.goto();
  });

  test('Mobile', async ({
    SinglePostPage,
    page: currentPage,
    Post,
    isMobile,
    Api,
  }) => {
    // eslint-disable-next-line playwright/no-conditional-in-test
    if (!isMobile) {
      return;
    }

    const postBySlugResponse =
      await Api.routes.posts.getPostBySlug.waitForRequest({
        preRequestAction: Post.openPostById.bind(Post, post.id),
      });

    expect(postBySlugResponse.url()).toContain(post.slug);
    await expect(currentPage).toHaveURL(
      SinglePostPage.getUrlWithSlug(post.slug),
    );
    await expect(currentPage).toHaveTitle(SinglePostPage.getTitle(post.title));
    await expect(Post.getTitleById(post.id)).toHaveText(post.title);
  });

  test('Desktop', async ({ Api, SinglePostPage, Post, isMobile }) => {
    // eslint-disable-next-line playwright/no-conditional-in-test
    if (isMobile) {
      return;
    }

    const newPage = await Post.openPostByIdInNewTab(post.id);

    const postBySlugResponse =
      await Api.routes.posts.getPostBySlug.waitForRequest({
        page: newPage,
      });

    // Setting a new browser tab context
    Post.setPage(newPage);

    expect(postBySlugResponse.url()).toContain(post.slug);
    await expect(newPage).toHaveURL(SinglePostPage.getUrlWithSlug(post.slug));
    await expect(newPage).toHaveTitle(SinglePostPage.getTitle(post.title));
    await expect(Post.getTitleById(post.id)).toHaveText(post.title);
  });
});

test('Opens a post by its link', async ({ SinglePostPage, Post, Api }) => {
  const postBySlugResponse =
    await Api.routes.posts.getPostBySlug.waitForRequest({
      preRequestAction: SinglePostPage.goto.bind(SinglePostPage, post.slug),
    });

  expect(postBySlugResponse.url()).toContain(post.slug);
  await expect(Post.getTitleById(post.id)).toContainText(post.title);
});

test('Redirect to 404 if the post is not found', async ({
  SinglePostPage,
  NotFoundPage,
  NotificationList,
  page: currentPage,
  Api,
}) => {
  Api.routes.posts.getPostBySlug.mock({
    status: 404,
    body: {
      error: {
        message: 'Post does not exist',
      },
    },
  });

  await SinglePostPage.goto(post.slug);

  await NotFoundPage.waitForNotFoundPage();
  await expect(currentPage).toHaveTitle(NotFoundPage.title);
  await expect(NotificationList.root).toContainText('Post does not exist');
});

test('Fetches post comments by post id', async ({ SinglePostPage, Api }) => {
  const commentsResponse = await Api.routes.comments.getComments.waitForRequest(
    {
      preRequestAction: SinglePostPage.goto.bind(SinglePostPage, post.slug),
    },
  );

  const requestUrl = commentsResponse.url();

  expect(requestUrl).toContain(post.id);
  expect(requestUrl).toContain(`limit=10&post=${post.id}`);
});

test('Opens user profile after clicking on the author of the post', async ({
  SinglePostPage,
  ProfilePage,
  Post,
  page: currentPage,
  Api,
}) => {
  Api.routes.users.getUserProfile.mock({
    body: createRandomProfile(),
  });

  await SinglePostPage.goto(post.slug);

  const getUserProfileResponse =
    await Api.routes.users.getUserProfile.waitForRequest({
      preRequestAction: Post.openPostAuthorProfile.bind(Post, post.id),
    });

  expect(getUserProfileResponse.url()).toContain(post.author.login);
  await expect(currentPage).toHaveURL(
    ProfilePage.getUrlWithLogin(post.author.login),
  );
  await expect(currentPage).toHaveTitle(
    ProfilePage.getTitle(post.author.login),
  );
});

test.describe('Sections', () => {
  test('Shows text section', async ({ Api, SinglePostPage, Post }) => {
    const section = createRandomSection({ type: 'text' });

    const postWithSections = createRandomPost({
      sections: [section],
    });

    Api.routes.posts.getPostBySlug.mock({
      body: postWithSections,
    });

    await SinglePostPage.goto(postWithSections.slug);

    await expect(
      Post.getTextSectionByHash(postWithSections.id, section.hash),
    ).toContainText(section.content);
  });

  test('Shows pic section', async ({ Api, SinglePostPage, Post }) => {
    const section = createRandomSection({ type: 'pic' });

    const postWithSections = createRandomPost({
      sections: [section],
    });

    Api.routes.posts.getPostBySlug.mock({
      body: postWithSections,
    });

    await SinglePostPage.goto(postWithSections.slug);

    await expect(
      Post.getPicSectionByHash(postWithSections.id, section.hash),
    ).toBeVisible();
    await expect(
      Post.getPicSectionByHash(postWithSections.id, section.hash),
    ).toHaveAttribute('alt', section.url);
  });

  test('Shows video section', async ({ Api, SinglePostPage, Post }) => {
    const section = createRandomSection({ type: 'vid' });

    const postWithSections = createRandomPost({
      sections: [section],
    });

    Api.routes.posts.getPostBySlug.mock({
      body: postWithSections,
    });

    await SinglePostPage.goto(postWithSections.slug);

    await expect(
      Post.getVideoSectionByHash(postWithSections.id, section.hash),
    ).toBeVisible();
    await expect(
      Post.getVideoSectionByHash(postWithSections.id, section.hash),
    ).toHaveAttribute('src', section.url);
  });

  test('Shows multiple sections at the same time', async ({
    Api,
    SinglePostPage,
    Post,
  }) => {
    const sections = [
      createRandomSection({ type: 'pic' }),
      createRandomSection({ type: 'text' }),
      createRandomSection({ type: 'vid' }),
    ];

    const postWithSections = createRandomPost({
      sections,
    });

    Api.routes.posts.getPostBySlug.mock({
      body: postWithSections,
    });

    await SinglePostPage.goto(postWithSections.slug);

    await expect(
      Post.getPicSectionByHash(postWithSections.id, sections[0].hash),
    ).toHaveAttribute('alt', sections[0].url);

    await expect(
      Post.getTextSectionByHash(postWithSections.id, sections[1].hash),
    ).toBeVisible();
    await expect(
      Post.getTextSectionByHash(postWithSections.id, sections[1].hash),
    ).toContainText(sections[1].content);

    await expect(
      Post.getVideoSectionByHash(postWithSections.id, sections[2].hash),
    ).toBeVisible();
    await expect(
      Post.getVideoSectionByHash(postWithSections.id, sections[2].hash),
    ).toHaveAttribute('src', sections[2].url);
  });
});

test.describe('Post edit', () => {
  const nowISOString = new Date().toISOString();

  const currentUserNewerPost = createRandomPost({
    createdAt: subMinutes(nowISOString, 9).toISOString(),
    author: {
      id: auth.id,
    },
  });
  currentUserNewerPost.sections = currentUserNewerPost.sections.slice(0, 1);

  test.beforeEach(async ({ Api }) => {
    Api.routes.posts.getPostBySlug.mock({
      body: currentUserNewerPost,
    });
  });

  test('The current user cannot edit or delete their post if the post is older than 10 mins', async ({
    SinglePostPage,
    Post,
    context,
    Api,
  }) => {
    await mockDate(context, nowISOString);

    const oldPost = createRandomPost({
      // Posted 11 minutes ago from now
      createdAt: subMinutes(nowISOString, 11).toISOString(),
      author: {
        id: auth.id,
      },
    });

    Api.routes.posts.getPostBySlug.mock({
      body: oldPost,
    });

    await SinglePostPage.goto(oldPost.slug);

    await expect(Post.editBtn).toBeHidden();
    await expect(Post.deleteBtn).toBeHidden();
  });

  test('The current user cannot open post edit page for their post if the post is older than 10 mins', async ({
    SinglePostPage,
    PostsPage,
    NotificationList,
    page: currentPage,
    context,
    Api,
  }) => {
    await mockDate(context, nowISOString);

    const oldPost = createRandomPost({
      // Posted 11 minutes ago from now
      createdAt: subMinutes(nowISOString, 11).toISOString(),
      author: {
        id: auth.id,
      },
    });

    Api.routes.posts.getPostBySlug.mock({
      body: oldPost,
    });

    await SinglePostPage.gotoEditPage(oldPost.slug);

    await expect(currentPage).toHaveURL(PostsPage.urls.today);
    await expect(currentPage).toHaveTitle(PostsPage.titles.today);
    await expect(NotificationList.root).toContainText(
      'You cannot edit this post anymore. The time allowed to edit has expired',
    );
  });

  test('Cannot open edit page for a post if the post author is not the current user', async ({
    SinglePostPage,
    PostsPage,
    page: currentPage,
    NotificationList,
    context,
    Api,
  }) => {
    await mockDate(context, nowISOString);

    const notCurrentUserPost = createRandomPost({
      createdAt: subMinutes(nowISOString, 9).toISOString(),
      author: {
        login: 'not-the-current-user',
      },
    });

    Api.routes.posts.getPostBySlug.mock({
      body: notCurrentUserPost,
    });

    await SinglePostPage.gotoEditPage(post.slug);

    await expect(currentPage).toHaveURL('/');
    await expect(currentPage).toHaveTitle(PostsPage.titles.today);
    await expect(NotificationList.root).toContainText(
      "Only post's author can edit this post",
    );
  });

  test('Opens post edit page if the post is not older than 10 mins', async ({
    SinglePostPage,
    PostEditPage,
    Post,
    page: currentPage,
    PostEditor,
    context,
  }) => {
    await mockDate(context, nowISOString);

    await SinglePostPage.goto(currentUserNewerPost.slug);

    await Post.startEditingPost();

    await expect(currentPage).toHaveURL(
      PostEditPage.getUrlWithSlug(currentUserNewerPost.slug),
    );
    await expect(currentPage).toHaveTitle(PostEditPage.title);
    await expect(PostEditor.textSectionInput).toHaveText(
      currentUserNewerPost.sections[0].content,
    );
  });

  test('Opens post edit page, edits the post and saves it if the post is not older than 10 mins', async ({
    page: currentPage,
    SinglePostPage,
    PostEditor,
    NotificationList,
    context,
    Api,
  }) => {
    await mockDate(context, nowISOString);

    Api.routes.posts.updatePostById.mock({
      body: {
        ok: true,
      },
    });

    await SinglePostPage.gotoEditPage(currentUserNewerPost.slug);

    await PostEditor.typeInTextSection('edited');

    const editPostResponse =
      await Api.routes.posts.updatePostById.waitForRequest({
        preRequestAction: PostEditor.submitEditedPost.bind(PostEditor),
      });

    expect(editPostResponse.url()).toContain(currentUserNewerPost.id);
    expect(editPostResponse.postDataJSON()).toMatchObject({
      sections: [
        {
          hash: currentUserNewerPost.sections[0].hash,
          type: 'text',
          content: `edited${currentUserNewerPost.sections[0].content}`,
        },
      ],
    });
    await expect(NotificationList.root).toHaveText(
      'Post has been saved successfully',
    );
    await expect(currentPage).toHaveURL(
      SinglePostPage.getUrlWithSlug(currentUserNewerPost.slug),
    );
  });

  test('Deletes a post, sends delete request', async ({
    SinglePostPage,
    Post,
    PostsPage,
    context,
    page: currentPage,
    NotificationList,
    Api,
  }) => {
    Api.routes.posts.deletePostById.mock({
      status: 200,
    });

    await mockDate(context, nowISOString);

    await SinglePostPage.goto(currentUserNewerPost.slug);

    const deletePostByIdResponse =
      await Api.routes.posts.deletePostById.waitForRequest({
        preRequestAction: Post.deletePost.bind(Post),
      });

    expect(deletePostByIdResponse.url()).toContain(currentUserNewerPost.id);
    await expect(currentPage).toHaveURL(PostsPage.urls.today);
    await expect(currentPage).toHaveTitle(PostsPage.titles.today);
    await expect(NotificationList.root).toHaveText(
      'The post has been successfully deleted',
    );
  });
});
