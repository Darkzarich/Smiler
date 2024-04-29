/* eslint-disable no-await-in-loop */
// @ts-check

import { test, expect } from '@playwright/test';
import generateAuth from './factory/auth';
import generateComment from './factory/comment';
import generatePost from './factory/post';
import generateProfile from './factory/profile';
import mockDate from './utils/mock-date';

const post = generatePost();

test.beforeEach(async ({ context }) => {
  await context.route('*/**/users/get-auth', async (route) => {
    await route.fulfill({
      json: generateAuth(),
    });
  });

  await context.route(`*/**/posts/${post.slug}`, async (route) => {
    await route.fulfill({
      json: post,
    });
  });

  await context.route('*/**/posts*', async (route) => {
    await route.fulfill({
      json: {
        pages: 0,
        posts: [post],
      },
    });
  });

  await context.route('*/**/comments*', async (route) => {
    await route.fulfill({
      json: {
        pages: 0,
        comments: [generateComment()],
      },
    });
  });
});

test.describe('Fetches the post by the slug of the post', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Mobile', async ({ page, isMobile }) => {
    // eslint-disable-next-line playwright/no-conditional-in-test
    if (!isMobile) {
      return;
    }

    const postBySlugRequest = page.waitForRequest(`*/**/posts/${post.slug}`);

    await page.getByTestId(`post-${post.id}-title`).click();

    await postBySlugRequest;

    await expect(page).toHaveURL(`/post/${post.slug}`);
    await expect(page).toHaveTitle(`${post.title} | Smiler`);
    await expect(page.getByTestId(`post-${post.id}-title`)).toHaveText(
      post.title,
    );
  });
  test('Desktop', async ({ context, page, isMobile }) => {
    // eslint-disable-next-line playwright/no-conditional-in-test
    if (isMobile) {
      return;
    }

    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByTestId(`post-${post.id}-title`).click(),
    ]);

    const postBySlugRequest = newPage.waitForRequest(`*/**/posts/${post.slug}`);

    await postBySlugRequest;

    await expect(newPage).toHaveURL(`/post/${post.slug}`);
    await expect(newPage).toHaveTitle(`${post.title} | Smiler`);
    await expect(newPage.getByTestId(`post-${post.id}-title`)).toHaveText(
      post.title,
    );
  });
});

test('Opens the post from the list of posts', async ({ page }) => {
  const postBySlugRequest = page.waitForRequest(`*/**/posts/${post.slug}`);

  await page.goto(`/post/${post.slug}`);

  await postBySlugRequest;

  await expect(page.getByTestId(`post-${post.id}-title`)).toContainText(
    post.title,
  );
});

test('Redirect to 404 if the post is not found', async ({ page, context }) => {
  await context.route(`*/**/posts/${post.slug}`, async (route) => {
    await route.fulfill({
      status: 404,
      json: {
        error: {
          message: 'Post does not exist',
        },
      },
    });
  });

  await page.goto(`/post/${post.slug}`);

  await expect(page).toHaveURL('/error/404');
  await expect(page).toHaveTitle('404 Not Found | Smiler');
  await expect(page.getByTestId('system-notification')).toContainText(
    'Post does not exist',
  );
});

test('Fetches post comments by post id', async ({ page }) => {
  const commentsRequest = page.waitForRequest('*/**/comments*');

  await page.goto(`/post/${post.slug}`);

  const commentsResponse = await commentsRequest;

  expect(commentsResponse.url()).toContain(`limit=10&post=${post.id}`);
});

test('Opens user profile after clicking on the author of the post', async ({
  page,
  context,
}) => {
  await context.route(`**/users/${post.author.login}`, async (route) => {
    await route.fulfill({
      json: generateProfile(),
    });
  });

  await page.goto(`/post/${post.slug}`);

  await page.getByTestId(`post-${post.id}-author`).click();

  await expect(page).toHaveURL(`/user/@${post.author.login}`);
  await expect(page).toHaveTitle(`${post.author.login} | Smiler`);
});

test.describe('Sections', () => {
  async function mockPostSection(context, section) {
    const postWithSections = {
      id: '1',
      sections: Array.isArray(section) ? section : [section],
    };

    await context.route(`*/**/posts/${post.slug}`, async (route) => {
      await route.fulfill({
        json: generatePost(postWithSections),
      });
    });

    return post;
  }

  test('Shows text section', async ({ context, page }) => {
    const section = {
      hash: '1',
      type: 'text',
      content: 'test',
    };

    const mockedPost = await mockPostSection(context, section);

    await page.goto(`/post/${mockedPost.slug}`);

    await expect(
      page.getByTestId(`post-${mockedPost.id}-text-${section.hash}`),
    ).toContainText(section.content);
  });

  test('Shows pic section', async ({ context, page }) => {
    const section = {
      hash: '2',
      type: 'pic',
      url: 'test',
    };

    const mockedPost = await mockPostSection(context, section);

    await page.goto(`/post/${mockedPost.slug}`);

    await expect(
      page.getByTestId(`post-${mockedPost.id}-pic-${section.hash}`),
    ).toBeVisible();
    await expect(
      page.getByTestId(`post-${mockedPost.id}-pic-${section.hash}`),
    ).toHaveAttribute('alt', section.url);
  });

  test('Shows video section', async ({ context, page }) => {
    const section = {
      hash: '3',
      type: 'vid',
      url: 'test',
    };

    const mockedPost = await mockPostSection(context, section);

    await page.goto(`/post/${mockedPost.slug}`);

    await expect(
      page.getByTestId(`post-${mockedPost.id}-vid-${section.hash}`),
    ).toBeVisible();
    await expect(
      page.getByTestId(`post-${mockedPost.id}-vid-${section.hash}`),
    ).toHaveAttribute('src', section.url);
  });

  test('Shows multiple sections at the same time', async ({
    context,
    page,
  }) => {
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

    const mockedPost = await mockPostSection(context, sections);

    await page.goto(`/post/${mockedPost.slug}`);

    await expect(
      page.getByTestId(`post-${mockedPost.id}-pic-${sections[0].hash}`),
    ).toBeVisible();
    await expect(
      page.getByTestId(`post-${mockedPost.id}-pic-${sections[0].hash}`),
    ).toHaveAttribute('alt', sections[0].url);
    await expect(
      page.getByTestId(`post-${mockedPost.id}-text-${sections[1].hash}`),
    ).toContainText(sections[1].content);
    await expect(
      page.getByTestId(`post-${mockedPost.id}-vid-${sections[2].hash}`),
    ).toBeVisible();
    await expect(
      page.getByTestId(`post-${mockedPost.id}-vid-${sections[2].hash}`),
    ).toHaveAttribute('src', sections[2].url);
  });
});

test.describe('Post edit', () => {
  test.beforeEach(async ({ context }) => {
    await context.route('*/**/users/get-auth', async (route) => {
      await route.fulfill({
        json: generateAuth({
          isAuth: true,
        }),
      });
    });
  });

  test('Cannot edit or delete a post if the post is older than 10 mins', async ({
    page,
    context,
  }) => {
    const dateToMock = '2024-03-06T00:00:00.000Z';

    mockDate(context, dateToMock);

    await context.route(`*/**/posts/${post.slug}`, async (route) => {
      await route.fulfill({
        json: generatePost({
          createdAt: new Date(
            new Date(dateToMock).getTime() - 1000 * 60 * 11, // 11 mins
          ).toISOString(),
        }),
      });
    });

    await page.goto(`/post/${post.slug}`);

    await expect(page.getByTestId('post-edit-icon')).toBeHidden();
    await expect(page.getByTestId('post-delete-icon')).toBeHidden();
  });

  test('Cannot open edit page for a post if the post is older than 10 mins', async ({
    page,
    context,
  }) => {
    const dateToMock = '2024-03-06T00:00:00.000Z';

    mockDate(context, dateToMock);

    await context.route(`*/**/posts/${post.slug}`, async (route) => {
      await route.fulfill({
        json: generatePost({
          createdAt: new Date(
            new Date(dateToMock).getTime() - 1000 * 60 * 11, // 11 mins
          ).toISOString(),
        }),
      });
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
  }) => {
    const dateToMock = '2024-03-06T00:00:00.000Z';

    mockDate(context, dateToMock);

    await context.route(`*/**/posts/${post.slug}`, async (route) => {
      await route.fulfill({
        json: generatePost({
          createdAt: new Date(
            new Date(dateToMock).getTime() - 1000 * 60 * 9, // 9 mins
          ).toISOString(),
          author: {
            id: '2',
            login: 'EditTester',
          },
        }),
      });
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
  }) => {
    const dateToMock = '2024-03-06T00:00:00.000Z';

    mockDate(context, dateToMock);

    await context.route(`*/**/posts/${post.slug}`, async (route) => {
      await route.fulfill({
        json: generatePost({
          createdAt: new Date(
            new Date(dateToMock).getTime() - 1000 * 60 * 9, // 9 mins
          ).toISOString(),
        }),
      });
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
  }) => {
    const dateToMock = '2024-03-06T00:00:00.000Z';

    mockDate(context, dateToMock);

    await context.route(`*/**/posts/${post.slug}`, async (route) => {
      await route.fulfill({
        json: generatePost({
          createdAt: new Date(
            new Date(dateToMock).getTime() - 1000 * 60 * 9, // 9 mins
          ).toISOString(),
        }),
      });
    });

    await page.goto(`/post/${post.slug}/edit`);

    await page.getByTestId('text-section-input').focus();
    await page.keyboard.type('edited');

    const editPostRequest = page.waitForRequest(
      (res) =>
        res.url().includes(`/posts/${post.id}`) && res.method() === 'PUT',
    );

    await page.getByTestId('finish-edit-post-button').click();

    const editPostResponse = await editPostRequest;

    expect(editPostResponse.postDataJSON()).toMatchObject({
      sections: [
        {
          type: 'text',
          content: `edited${post.sections[0].content}`,
        },
      ],
    });
  });

  test('Deletes a post, sends delete request', async ({ page, context }) => {
    await context.route(`*/**/posts/${post.id}`, async (route) => {
      await route.fulfill({
        status: 200,
      });
    });

    const dateToMock = '2024-03-06T00:00:00.000Z';

    mockDate(context, dateToMock);

    await context.route(`*/**/posts/${post.slug}`, async (route) => {
      await route.fulfill({
        json: generatePost({
          createdAt: new Date(
            new Date(dateToMock).getTime() - 1000 * 60 * 9, // 9 mins
          ).toISOString(),
        }),
      });
    });

    await page.goto(`/post/${post.slug}`);

    const deletePostRequest = page.waitForRequest(
      (res) =>
        res.url().includes(`/posts/${post.id}`) && res.method() === 'DELETE',
    );

    await page.getByTestId('post-delete-icon').click();

    await deletePostRequest;

    await expect(page).toHaveURL('/');
    await expect(page).toHaveTitle('Home | Smiler');
  });
});
