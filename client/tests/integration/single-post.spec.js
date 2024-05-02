/* eslint-disable no-await-in-loop */
// @ts-check

import { expect } from '@playwright/test';
import generateAuth from './factory/auth';
import generateComment from './factory/comment';
import generatePost from './factory/post';
import generateProfile from './factory/profile';
import test from './page-objects';
import mockDate from './utils/mock-date';

const post = generatePost();

test.beforeEach(async ({ Api }) => {
  Api.routes.auth.getAuth.mock({
    body: generateAuth(),
  });

  Api.routes.posts.getPostBySlug.mock({
    body: post,
  });

  Api.routes.posts.getPosts.mock({
    body: {
      pages: 0,
      posts: [post],
    },
  });

  Api.routes.comments.getComments.mock({
    body: {
      pages: 0,
      comments: [generateComment()],
    },
  });
});

test.describe('Fetches a post by the slug of the post after clicking it in the list of posts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Mobile', async ({ page, isMobile, Api }) => {
    // eslint-disable-next-line playwright/no-conditional-in-test
    if (!isMobile) {
      return;
    }

    const postBySlugResponse =
      await Api.routes.posts.getPostBySlug.waitForRequest({
        beforeAction: async () => {
          await page.getByTestId(`post-${post.id}-title`).click();
        },
      });

    expect(postBySlugResponse.url()).toContain(post.slug);
    await expect(page).toHaveURL(`/post/${post.slug}`);
    await expect(page).toHaveTitle(`${post.title} | Smiler`);
    await expect(page.getByTestId(`post-${post.id}-title`)).toHaveText(
      post.title,
    );
  });
  test('Desktop', async ({ context, Api, page, isMobile }) => {
    // eslint-disable-next-line playwright/no-conditional-in-test
    if (isMobile) {
      return;
    }

    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByTestId(`post-${post.id}-title`).click(),
    ]);

    const postBySlugResponse =
      await Api.routes.posts.getPostBySlug.waitForRequest({
        page: newPage,
      });

    expect(postBySlugResponse.url()).toContain(post.slug);
    await expect(newPage).toHaveURL(`/post/${post.slug}`);
    await expect(newPage).toHaveTitle(`${post.title} | Smiler`);
    await expect(newPage.getByTestId(`post-${post.id}-title`)).toHaveText(
      post.title,
    );
  });
});

test('Opens a post by its link', async ({ page, Api }) => {
  const postBySlugResponse =
    await Api.routes.posts.getPostBySlug.waitForRequest({
      beforeAction: async () => {
        await page.goto(`/post/${post.slug}`);
      },
    });

  expect(postBySlugResponse.url()).toContain(post.slug);
  await expect(page.getByTestId(`post-${post.id}-title`)).toContainText(
    post.title,
  );
});

test('Redirect to 404 if the post is not found', async ({ page, Api }) => {
  Api.routes.posts.getPostBySlug.mock({
    status: 404,
    body: {
      error: {
        message: 'Post does not exist',
      },
    },
  });

  await page.goto(`/post/${post.slug}`);

  await expect(page).toHaveURL('/error/404');
  await expect(page).toHaveTitle('404 Not Found | Smiler');
  await expect(page.getByTestId('system-notification')).toContainText(
    'Post does not exist',
  );
});

test('Fetches post comments by post id', async ({ page, Api }) => {
  const commentsResponse = await Api.routes.comments.getComments.waitForRequest(
    {
      beforeAction: async () => {
        await page.goto(`/post/${post.slug}`);
      },
    },
  );

  const requestUrl = commentsResponse.url();

  expect(requestUrl).toContain(post.id);
  expect(requestUrl).toContain(`limit=10&post=${post.id}`);
});

test('Opens user profile after clicking on the author of the post', async ({
  page,
  Api,
}) => {
  Api.routes.users.getUserProfile.mock({
    body: generateProfile(),
  });

  await page.goto(`/post/${post.slug}`);

  const getUserProfileResponse =
    await Api.routes.users.getUserProfile.waitForRequest({
      beforeAction: async () => {
        await page.getByTestId(`post-${post.id}-author`).click();
      },
    });

  expect(getUserProfileResponse.url()).toContain(post.author.login);
  await expect(page).toHaveURL(`/user/@${post.author.login}`);
  await expect(page).toHaveTitle(`${post.author.login} | Smiler`);
});

test.describe('Sections', () => {
  test('Shows text section', async ({ Api, page }) => {
    const section = {
      hash: '1',
      type: 'text',
      content: 'test',
    };

    const postWithSections = generatePost({
      sections: [section],
    });

    Api.routes.posts.getPostBySlug.mock({
      body: postWithSections,
    });

    await page.goto(`/post/${postWithSections.slug}`);

    await expect(
      page.getByTestId(`post-${postWithSections.id}-text-${section.hash}`),
    ).toContainText(section.content);
  });

  test('Shows pic section', async ({ Api, page }) => {
    const section = {
      hash: '2',
      type: 'pic',
      url: 'test',
    };

    const postWithSections = generatePost({
      sections: [section],
    });

    Api.routes.posts.getPostBySlug.mock({
      body: postWithSections,
    });

    await page.goto(`/post/${postWithSections.slug}`);

    await expect(
      page.getByTestId(`post-${postWithSections.id}-pic-${section.hash}`),
    ).toBeVisible();
    await expect(
      page.getByTestId(`post-${postWithSections.id}-pic-${section.hash}`),
    ).toHaveAttribute('alt', section.url);
  });

  test('Shows video section', async ({ Api, page }) => {
    const section = {
      hash: '3',
      type: 'vid',
      url: 'test',
    };

    const postWithSections = generatePost({
      sections: [section],
    });

    Api.routes.posts.getPostBySlug.mock({
      body: postWithSections,
    });

    await page.goto(`/post/${postWithSections.slug}`);

    await expect(
      page.getByTestId(`post-${postWithSections.id}-vid-${section.hash}`),
    ).toBeVisible();
    await expect(
      page.getByTestId(`post-${postWithSections.id}-vid-${section.hash}`),
    ).toHaveAttribute('src', section.url);
  });

  test('Shows multiple sections at the same time', async ({ Api, page }) => {
    const sections = [
      {
        hash: '1',
        type: 'pic',
        url: 'test',
      },
      {
        hash: '2',
        type: 'text',
        content: 'test text',
      },
      {
        hash: '3',
        type: 'vid',
        url: 'test',
      },
    ];

    const postWithSections = generatePost({
      sections,
    });

    Api.routes.posts.getPostBySlug.mock({
      body: postWithSections,
    });

    await page.goto(`/post/${postWithSections.slug}`);

    await expect(
      page.getByTestId(`post-${postWithSections.id}-pic-${sections[0].hash}`),
    ).toBeVisible();
    await expect(
      page.getByTestId(`post-${postWithSections.id}-pic-${sections[0].hash}`),
    ).toHaveAttribute('alt', sections[0].url);
    await expect(
      page.getByTestId(`post-${postWithSections.id}-text-${sections[1].hash}`),
    ).toContainText(sections[1].content);
    await expect(
      page.getByTestId(`post-${postWithSections.id}-vid-${sections[2].hash}`),
    ).toBeVisible();
    await expect(
      page.getByTestId(`post-${postWithSections.id}-vid-${sections[2].hash}`),
    ).toHaveAttribute('src', sections[2].url);
  });
});

test.describe('Post edit', () => {
  test.beforeEach(async ({ Api }) => {
    Api.routes.auth.getAuth.mock({
      body: generateAuth({
        isAuth: true,
      }),
    });
  });

  test('Cannot edit or delete a post if the post is older than 10 mins', async ({
    page,
    context,
    Api,
  }) => {
    const dateToMock = '2024-03-06T00:00:00.000Z';

    await mockDate(context, dateToMock);

    Api.routes.posts.getPostBySlug.mock({
      body: generatePost({
        createdAt: new Date(
          new Date(dateToMock).getTime() - 1000 * 60 * 11, // 11 mins
        ).toISOString(),
      }),
    });

    await page.goto(`/post/${post.slug}`);

    await expect(page.getByTestId('post-edit-icon')).toBeHidden();
    await expect(page.getByTestId('post-delete-icon')).toBeHidden();
  });

  test('Cannot open edit page for a post if the post is older than 10 mins', async ({
    page,
    context,
    Api,
  }) => {
    const dateToMock = '2024-03-06T00:00:00.000Z';

    await mockDate(context, dateToMock);

    Api.routes.posts.getPostBySlug.mock({
      body: generatePost({
        createdAt: new Date(
          new Date(dateToMock).getTime() - 1000 * 60 * 11, // 11 mins
        ).toISOString(),
      }),
    });

    await page.goto(`/post/${post.slug}/edit`);

    await expect(page).toHaveURL('/');
    await expect(page).toHaveTitle('Home | Smiler');
    await expect(page.getByTestId('system-notification')).toContainText(
      'You cannot edit this post anymore. Edit time has expired',
    );
  });

  test('Cannot open edit page for a post if the post author is not the logged in user', async ({
    page,
    context,
    Api,
  }) => {
    const dateToMock = '2024-03-06T00:00:00.000Z';

    await mockDate(context, dateToMock);

    Api.routes.posts.getPostBySlug.mock({
      body: generatePost({
        createdAt: new Date(
          new Date(dateToMock).getTime() - 1000 * 60 * 9, // 9 mins
        ).toISOString(),
        author: {
          id: '2',
          login: 'EditTester',
        },
      }),
    });

    await page.goto(`/post/${post.slug}/edit`);

    await expect(page).toHaveURL('/');
    await expect(page).toHaveTitle('Home | Smiler');
    await expect(page.getByTestId('system-notification')).toContainText(
      "Only post's author can edit this post",
    );
  });

  test('Opens edit a post page if the post is not older than 10 mins', async ({
    page,
    context,
    Api,
  }) => {
    const dateToMock = '2024-03-06T00:00:00.000Z';

    await mockDate(context, dateToMock);

    Api.routes.posts.getPostBySlug.mock({
      body: generatePost({
        createdAt: new Date(
          new Date(dateToMock).getTime() - 1000 * 60 * 9, // 9 mins
        ).toISOString(),
      }),
    });

    await page.goto(`/post/${post.slug}`);

    await page.getByTestId('post-edit-icon').click();

    await expect(page).toHaveURL(`/post/${post.slug}/edit`);
    await expect(page).toHaveTitle(`Edit Post | Smiler`);
    await expect(page.getByTestId('text-section-input')).toHaveText(
      post.sections[0].content,
    );
  });

  test('Open edit a post page, edit the post and save', async ({
    page,
    context,
    Api,
  }) => {
    const dateToMock = '2024-03-06T00:00:00.000Z';

    await mockDate(context, dateToMock);

    Api.routes.posts.getPostBySlug.mock({
      body: generatePost({
        createdAt: new Date(
          new Date(dateToMock).getTime() - 1000 * 60 * 9, // 9 mins
        ).toISOString(),
      }),
    });

    await page.goto(`/post/${post.slug}/edit`);

    await page.getByTestId('text-section-input').focus();
    await page.keyboard.type('edited');

    const editPostResponse =
      await Api.routes.posts.updatePostById.waitForRequest({
        beforeAction: async () => {
          await page.getByTestId('finish-edit-post-button').click();
        },
      });

    expect(editPostResponse.url()).toContain(post.id);
    expect(editPostResponse.postDataJSON()).toMatchObject({
      sections: [
        {
          type: 'text',
          content: `edited${post.sections[0].content}`,
        },
      ],
    });
  });

  test('Deletes a post, sends delete request', async ({
    page,
    context,
    Api,
  }) => {
    Api.routes.posts.deletePostById.mock({
      status: 200,
    });

    const dateToMock = '2024-03-06T00:00:00.000Z';

    await mockDate(context, dateToMock);

    Api.routes.posts.getPostBySlug.mock({
      body: generatePost({
        createdAt: new Date(
          new Date(dateToMock).getTime() - 1000 * 60 * 9, // 9 mins
        ).toISOString(),
      }),
    });

    await page.goto(`/post/${post.slug}`);

    const deletePostByIdResponse =
      await Api.routes.posts.deletePostById.waitForRequest({
        beforeAction: async () => {
          await page.getByTestId('post-delete-icon').click();
        },
      });

    expect(deletePostByIdResponse.url()).toContain(post.id);
    await expect(page).toHaveURL('/');
    await expect(page).toHaveTitle('Home | Smiler');
  });
});
