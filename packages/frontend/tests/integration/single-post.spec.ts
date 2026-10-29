/* eslint-disable no-await-in-loop */

import { type Locator, expect } from '@playwright/test';
import { subMinutes } from 'date-fns';
import test from './page-objects';
import mockDate from './utils/mock-date';
import { postTypes } from '@api/posts';
import createRandomAuth from '@factory/auth';
import createRandomComment from '@factory/comment';
import createRandomPost from '@factory/post';
import createRandomProfile from '@factory/profile';
import createRandomSection from '@factory/section';

const auth = createRandomAuth({
  isAuth: true,
});
const post = createRandomPost();
const asParagraph = (text: string) => `<p>${text}</p>`;

test.beforeEach(async ({ Api }) => {
  Api.routes.auth.getAuth.mock({
    body: auth,
  });

  Api.routes.posts.getPostBySlug.mock({
    body: post,
  });

  Api.routes.posts.getToday.mock({
    body: {
      posts: [post],
      hasNextPage: false,
    },
  });

  Api.routes.comments.getComments.mock({
    body: {
      comments: [createRandomComment()],
    },
  });
});

test.describe('Opening a post from the list of posts', () => {
  test.beforeEach(async ({ PostsPage }) => {
    await PostsPage.goto();
  });

  test('Opens it in the same tab', async ({
    SinglePostPage,
    page: currentPage,
    Post,
    Api,
  }) => {
    const postBySlugResponse =
      await Api.routes.posts.getPostBySlug.waitForRequest({
        preRequestAction: Post.openPostById.bind(Post, post._id),
      });

    expect(postBySlugResponse.url()).toContain(post.slug);
    expect(currentPage.context().pages()).toHaveLength(1);
    await expect(currentPage).toHaveURL(
      SinglePostPage.getUrlWithSlug(post.slug),
    );
    await expect(currentPage).toHaveTitle(SinglePostPage.getTitle(post.title));
    await expect(Post.getTitleById(post._id)).toHaveText(post.title);
  });

  test('Opens it in a new tab on a middle click', async ({
    Api,
    SinglePostPage,
    PostsPage,
    page: currentPage,
    Post,
    isMobile,
  }) => {
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip(isMobile, 'A touch screen has no middle button');

    const newPage = await Post.openPostByIdInNewTab(post._id);

    const postBySlugResponse =
      await Api.routes.posts.getPostBySlug.waitForRequest({
        page: newPage,
      });

    await expect(currentPage).toHaveURL(PostsPage.urls.today);

    Post.setPage(newPage);

    expect(postBySlugResponse.url()).toContain(post.slug);
    await expect(newPage).toHaveURL(SinglePostPage.getUrlWithSlug(post.slug));
    await expect(newPage).toHaveTitle(SinglePostPage.getTitle(post.title));
    await expect(Post.getTitleById(post._id)).toHaveText(post.title);
  });
});

test('Opens a post by its link', async ({ SinglePostPage, Post, Api }) => {
  const postBySlugResponse =
    await Api.routes.posts.getPostBySlug.waitForRequest({
      preRequestAction: SinglePostPage.goto.bind(SinglePostPage, post.slug),
    });

  expect(postBySlugResponse.url()).toContain(post.slug);
  await expect(Post.getTitleById(post._id)).toContainText(post.title);
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
        message: "Post doesn't exist",
      },
    },
  });

  await SinglePostPage.goto(post.slug);

  await NotFoundPage.waitForNotFoundPage();
  await expect(currentPage).toHaveTitle(NotFoundPage.title);
  await expect(NotificationList.root).toContainText("Post doesn't exist");
});

test('Fetches post comments by post id', async ({ SinglePostPage, Api }) => {
  const commentsResponse = await Api.routes.comments.getComments.waitForRequest(
    {
      preRequestAction: SinglePostPage.goto.bind(SinglePostPage, post.slug),
    },
  );

  const requestUrl = commentsResponse.url();

  expect(requestUrl).toContain(post._id);
  expect(requestUrl).toContain(`limit=10&post=${post._id}`);
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
      preRequestAction: Post.openPostAuthorProfile.bind(Post, post._id),
    });

  expect(getUserProfileResponse.url()).toContain(post.author.login);
  await expect(currentPage).toHaveURL(
    ProfilePage.getUrlWithLogin(post.author.login),
  );
  await expect(currentPage).toHaveTitle(
    ProfilePage.getTitle(post.author.login),
  );
});

test('Comes back to the same place on the post on Back', async ({
  SinglePostPage,
  ProfilePage,
  Post,
  page: currentPage,
  Api,
}) => {
  const comments = Array.from({ length: 12 }, () => createRandomComment());
  // Far enough down to scroll to on a phone too, where the post's own author
  // link sits above its title
  const comment = comments[6];

  Api.routes.comments.getComments.mock({
    body: { comments },
  });
  Api.routes.users.getUserProfile.mock({
    body: createRandomProfile(),
  });

  await SinglePostPage.goto(post.slug);

  const author = currentPage.getByTestId(`comment-${comment._id}-author`);

  await expect(Post.getTitleById(post._id)).toBeVisible();
  await author.evaluate((link) => {
    link.scrollIntoView();
    window.scrollBy(0, -150);
  });

  const scrollY = await currentPage.evaluate(() => window.scrollY);

  expect(scrollY).toBeGreaterThan(0);

  await author.click();
  await expect(currentPage).toHaveURL(
    ProfilePage.getUrlWithLogin(comment.author.login),
  );
  await currentPage.goBack();

  await expect
    .poll(() => currentPage.evaluate(() => window.scrollY))
    .toBe(scrollY);
});

test.describe('Sections', () => {
  test('Shows text section', async ({ Api, SinglePostPage, Post }) => {
    const section = createRandomSection(postTypes.POST_SECTION_TYPES.TEXT);

    const postWithSections = createRandomPost({
      sections: [section],
    });

    Api.routes.posts.getPostBySlug.mock({
      body: postWithSections,
    });

    await SinglePostPage.goto(postWithSections.slug);

    await expect(
      Post.getTextSectionByHash(postWithSections._id, section.hash),
    ).toContainText(section.content);
  });

  test('Shows pic section', async ({ Api, SinglePostPage, Post }) => {
    const section = createRandomSection(postTypes.POST_SECTION_TYPES.PICTURE);

    const postWithSections = createRandomPost({
      sections: [section],
    });

    Api.routes.posts.getPostBySlug.mock({
      body: postWithSections,
    });

    await SinglePostPage.goto(postWithSections.slug);

    await expect(
      Post.getPicSectionByHash(postWithSections._id, section.hash),
    ).toBeVisible();
    await expect(
      Post.getPicSectionByHash(postWithSections._id, section.hash),
    ).toHaveAttribute('src', section.url);
  });

  test('Shows video section', async ({ Api, SinglePostPage, Post }) => {
    const section = createRandomSection(postTypes.POST_SECTION_TYPES.VIDEO);

    const postWithSections = createRandomPost({
      sections: [section],
    });

    Api.routes.posts.getPostBySlug.mock({
      body: postWithSections,
    });

    await SinglePostPage.goto(postWithSections.slug);

    await expect(
      Post.getVideoSectionByHash(postWithSections._id, section.hash),
    ).toBeVisible();
    await expect(
      Post.getVideoSectionByHash(postWithSections._id, section.hash),
    ).toHaveAttribute('src', section.url);
  });

  test('Hides a spoiler section until it is clicked', async ({
    Api,
    SinglePostPage,
    Post,
  }) => {
    const section = createRandomSection(postTypes.POST_SECTION_TYPES.TEXT, {
      isSpoiler: true,
    });

    const postWithSections = createRandomPost({
      sections: [section],
    });

    Api.routes.posts.getPostBySlug.mock({
      body: postWithSections,
    });

    await SinglePostPage.goto(postWithSections.slug);

    await expect(
      Post.getSpoilerVeilByHash(postWithSections._id, section.hash),
    ).toBeVisible();

    await Post.revealSpoilerByHash(postWithSections._id, section.hash);

    await expect(
      Post.getSpoilerVeilByHash(postWithSections._id, section.hash),
    ).toBeHidden();
    await expect(
      Post.getTextSectionByHash(postWithSections._id, section.hash),
    ).toContainText(section.content);
  });

  test('Shows multiple sections at the same time', async ({
    Api,
    SinglePostPage,
    Post,
  }) => {
    const sections = [
      createRandomSection(postTypes.POST_SECTION_TYPES.PICTURE),
      createRandomSection(postTypes.POST_SECTION_TYPES.TEXT),
      createRandomSection(postTypes.POST_SECTION_TYPES.VIDEO),
    ] as [
      postTypes.PostPictureSection,
      postTypes.PostTextSection,
      postTypes.PostVideoSection,
    ];

    const postWithSections = createRandomPost({
      sections,
    });

    Api.routes.posts.getPostBySlug.mock({
      body: postWithSections,
    });

    await SinglePostPage.goto(postWithSections.slug);

    await expect(
      Post.getPicSectionByHash(postWithSections._id, sections[0].hash),
    ).toHaveAttribute('src', sections[0].url);

    await expect(
      Post.getTextSectionByHash(postWithSections._id, sections[1].hash),
    ).toBeVisible();
    await expect(
      Post.getTextSectionByHash(postWithSections._id, sections[1].hash),
    ).toContainText(sections[1].content);

    await expect(
      Post.getVideoSectionByHash(postWithSections._id, sections[2].hash),
    ).toBeVisible();
    await expect(
      Post.getVideoSectionByHash(postWithSections._id, sections[2].hash),
    ).toHaveAttribute('src', sections[2].url);
  });
});

test.describe('Post edit', () => {
  const nowISOString = new Date().toISOString();

  const currentUserNewerPost = createRandomPost({
    createdAt: subMinutes(nowISOString, 9).toISOString(),
    author: {
      _id: auth._id,
    },
  }) as postTypes.Post & {
    sections: [
      postTypes.PostTextSection,
      postTypes.PostPictureSection,
      postTypes.PostVideoSection,
    ];
  };

  currentUserNewerPost.sections = currentUserNewerPost.sections.slice(
    0,
    1,
  ) as typeof currentUserNewerPost.sections;

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
        _id: auth._id,
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
        _id: auth._id,
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

    expect(editPostResponse.url()).toContain(currentUserNewerPost._id);
    expect(editPostResponse.postDataJSON()).toMatchObject({
      sections: [
        {
          ...currentUserNewerPost.sections[0],
          content: asParagraph(
            `edited${currentUserNewerPost.sections[0].content}`,
          ),
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

    expect(deletePostByIdResponse.url()).toContain(currentUserNewerPost._id);
    await expect(currentPage).toHaveURL(PostsPage.urls.today);
    await expect(currentPage).toHaveTitle(PostsPage.titles.today);
    await expect(NotificationList.root).toHaveText(
      'The post has been successfully deleted',
    );
  });

  test('Asks before deleting a post, and deletes nothing on Cancel or Escape', async ({
    SinglePostPage,
    Post,
    context,
    page: currentPage,
    Api,
  }) => {
    Api.routes.posts.deletePostById.mock({
      status: 200,
    });

    await mockDate(context, nowISOString);

    await SinglePostPage.goto(currentUserNewerPost.slug);

    const deleteRequests: string[] = [];

    currentPage.on('request', (req) => {
      if (req.method() === 'DELETE') {
        deleteRequests.push(req.url());
      }
    });

    await Post.deleteBtn.click();
    await Post.deleteConfirmModal.expectVisible();
    await expect(Post.deleteConfirmModal.cancelBtn).toBeFocused();

    await Post.deleteConfirmModal.cancel();
    await Post.deleteConfirmModal.expectHidden();
    await expect(Post.deleteBtn).toBeFocused();

    await Post.deleteBtn.click();
    await Post.deleteConfirmModal.expectVisible();
    await currentPage.keyboard.press('Escape');
    await Post.deleteConfirmModal.expectHidden();

    await expect(Post.getTitleById(currentUserNewerPost._id)).toBeVisible();
    await expect(currentPage).toHaveURL(
      SinglePostPage.getUrlWithSlug(currentUserNewerPost.slug),
    );
    expect(deleteRequests).toEqual([]);
  });
});

test.describe('Opens a post at its comments', () => {
  // Tall and late, so the comments move down after the post first renders
  const pictureUrl = 'https://placehold.co/600x1800';
  const picture = createRandomSection(postTypes.POST_SECTION_TYPES.PICTURE, {
    url: pictureUrl,
  });

  const postWithPicture = createRandomPost({
    sections: [
      createRandomSection(postTypes.POST_SECTION_TYPES.TEXT),
      picture,
      createRandomSection(postTypes.POST_SECTION_TYPES.TEXT),
    ],
  });

  const getNaturalHeight = (img: Locator) =>
    img.evaluate((el: HTMLImageElement) => el.naturalHeight);

  test.beforeEach(async ({ Api, page: currentPage }) => {
    Api.routes.posts.getPostBySlug.mock({
      body: postWithPicture,
    });

    Api.routes.posts.getToday.mock({
      body: {
        posts: [postWithPicture],
        hasNextPage: false,
      },
    });

    // Enough comments for the page to scroll them up to the header
    Api.routes.comments.getComments.mock({
      body: {
        comments: Array.from({ length: 10 }, () => createRandomComment()),
        hasNextPage: false,
      },
    });

    await currentPage.route(pictureUrl, async (route) => {
      await new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });
      await route.fulfill({
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="1800"/>',
      });
    });
  });

  test('From the comment count in the list of posts', async ({
    PostsPage,
    SinglePostPage,
    Post,
    page: currentPage,
  }) => {
    await PostsPage.goto();
    await Post.getCommentsCountById(postWithPicture._id).click();

    await expect(currentPage).toHaveURL(
      `${SinglePostPage.getUrlWithSlug(postWithPicture.slug)}#comments`,
    );
    await expect
      .poll(() =>
        getNaturalHeight(
          Post.getPicSectionByHash(postWithPicture._id, picture.hash),
        ),
      )
      .toBe(1800);
    await expect
      .poll(() => SinglePostPage.getCommentsOffsetFromHeader())
      .toBeLessThanOrEqual(1);
  });

  test('From a link to the comments', async ({ SinglePostPage, Post }) => {
    await SinglePostPage.gotoComments(postWithPicture.slug);

    await expect
      .poll(() =>
        getNaturalHeight(
          Post.getPicSectionByHash(postWithPicture._id, picture.hash),
        ),
      )
      .toBe(1800);
    await expect
      .poll(() => SinglePostPage.getCommentsOffsetFromHeader())
      .toBeLessThanOrEqual(1);
  });

  test('From a link to the comments on a slow network', async ({
    Api,
    SinglePostPage,
    page: currentPage,
  }) => {
    await currentPage.route(
      Api.routes.posts.getPostBySlug.getURLRegExp(),
      async (route) => {
        await new Promise((resolve) => {
          setTimeout(resolve, 6000);
        });
        await route.fallback();
      },
    );

    await SinglePostPage.gotoComments(postWithPicture.slug);

    await expect
      .poll(() => SinglePostPage.getCommentsOffsetFromHeader(), {
        timeout: 15_000,
      })
      .toBeLessThanOrEqual(1);
  });
});
