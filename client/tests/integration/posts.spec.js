/* eslint-disable no-await-in-loop */
// @ts-check

import { expect } from '@playwright/test';
import generateAuth from './factory/auth';
import generatePost from './factory/post';
import test from './page-objects';
import mockDate from './utils/mock-date';

const post1 = generatePost({
  id: '1',
});
const post2 = generatePost({
  id: '2',
});

const posts = [post1, post2];

test.beforeEach(async ({ Api }) => {
  Api.routes.auth.getAuth.mock({
    body: generateAuth(),
  });

  Api.routes.posts.getPosts.mock({
    body: {
      pages: 0,
      posts,
    },
  });
});

test('Fetches posts with expected filters', async ({ page, Api }) => {
  await Api.routes.posts.getPosts.waitForRequest({
    beforeAction: async () => {
      await page.goto('/');
    },
  });

  for (const post of posts) {
    await expect(page.getByTestId(`post-${post.id}-title`)).toContainText(
      post.title,
    );
  }
});

test('Empty posts lists', async ({ page, Api }) => {
  Api.routes.posts.getPosts.mock({
    body: {
      pages: 0,
      posts: [],
    },
  });

  await page.goto('/');

  await expect(page.getByTestId('posts-container')).toBeVisible();
  await expect(
    page.getByText("We're sorry. No posts for this time yet."),
  ).toBeVisible();
});

async function clickPostGroup({ page, group, isMobile }) {
  if (isMobile) {
    page.getByTestId('mobile-menu').click();
  }
  await page.getByTestId(group).click();
}

test.describe('Post groups', () => {
  test.beforeEach(async ({ context }) => {
    // playwright.config.js has Europe/Amsterdam (GMT+1) timezone set

    await mockDate(context, '2024-03-06T00:00:00.000Z');
  });

  test.describe('Not requiring auth', () => {
    test.beforeEach(async ({ page, Api }) => {
      await Api.routes.posts.getPosts.waitForRequest({
        beforeAction: async () => {
          await page.goto('/');
        },
      });
    });

    test('Fetches all posts', async ({ page, isMobile, Api }) => {
      const searchParams = new URLSearchParams({
        limit: '20',
        offset: '0',
        sort: '-rating',
      });

      const allPostsResponse = await Api.routes.posts.getPosts.waitForRequest({
        beforeAction: async () => {
          await clickPostGroup({
            group: 'all-link',
            isMobile,
            page,
          });
        },
      });

      expect(allPostsResponse.url()).toContain(searchParams.toString());
      await expect(page).toHaveURL(/.*posts\/all/);
      await expect(page).toHaveTitle('All Posts | Smiler');
      await expect(page.getByTestId('posts-container')).toBeVisible();
      for (const post of posts) {
        await expect(page.getByTestId(`post-${post.id}-title`)).toContainText(
          post.title,
        );
      }
    });

    test('Fetches "blowing" posts', async ({ page, isMobile, Api }) => {
      const searchParams = new URLSearchParams({
        limit: '20',
        offset: '0',
        sort: '-rating',
        ratingFrom: '50',
        // Two hours ago from the mocked date and rating is already at least 50
        dateFrom: '2024-03-05T22:00:00.000Z',
      });

      const blowingPostsResponse =
        await Api.routes.posts.getPosts.waitForRequest({
          beforeAction: async () => {
            await clickPostGroup({
              group: 'blowing-link',
              isMobile,
              page,
            });
          },
        });

      expect(blowingPostsResponse.url()).toContain(
        decodeURIComponent(searchParams.toString()),
      );
      await expect(page).toHaveURL(/.*posts\/blowing/);
      await expect(page).toHaveTitle('Blowing | Smiler');
      await expect(page.getByTestId('posts-container')).toBeVisible();
      for (const post of posts) {
        await expect(page.getByTestId(`post-${post.id}-title`)).toContainText(
          post.title,
        );
      }
    });

    test('Fetches "top this week" posts', async ({ page, isMobile, Api }) => {
      const searchParams = new URLSearchParams({
        limit: '20',
        offset: '0',
        sort: '-createdAt',
        // Posts with createdAt starting from the date of the start of this week
        dateFrom: '2024-03-02T23:00:00.000Z',
        dateTo: '2024-03-05T23:00:00.999Z',
      });

      const topThisWeekResponse =
        await Api.routes.posts.getPosts.waitForRequest({
          beforeAction: async () => {
            await clickPostGroup({
              group: 'top-this-week-link',
              isMobile,
              page,
            });
          },
        });

      expect(topThisWeekResponse.url()).toContain(
        decodeURIComponent(searchParams.toString()),
      );
      await expect(page).toHaveURL(/.*posts\/top-this-week/);
      await expect(page).toHaveTitle('Top This Week | Smiler');
      await expect(page.getByTestId('posts-container')).toBeVisible();
      for (const post of posts) {
        await expect(page.getByTestId(`post-${post.id}-title`)).toContainText(
          post.title,
        );
      }
    });

    test('Fetches "new" posts', async ({ page, isMobile, Api }) => {
      const searchParams = new URLSearchParams({
        limit: '20',
        offset: '0',
        sort: '-createdAt',
        // Within two hours from the mocked date
        dateFrom: '2024-03-05T22:00:00.000Z',
      });

      const newPostsResponse = await Api.routes.posts.getPosts.waitForRequest({
        beforeAction: async () => {
          await clickPostGroup({
            group: 'new-link',
            isMobile,
            page,
          });
        },
      });

      expect(newPostsResponse.url()).toContain(
        decodeURIComponent(searchParams.toString()),
      );
      await expect(page).toHaveURL(/.*posts\/new/);
      await expect(page).toHaveTitle('Recent | Smiler');
      await expect(page.getByTestId('posts-container')).toBeVisible();
      for (const post of posts) {
        await expect(page.getByTestId(`post-${post.id}-title`)).toContainText(
          post.title,
        );
      }
    });

    test('Fetches "today" posts', async ({ page, Api }) => {
      const searchParams = new URLSearchParams({
        limit: '20',
        offset: '0',
        sort: '-rating',
        // Within two hours from the mocked date
        dateFrom: '2024-03-05T23:00:00.000Z',
        dateTo: '2024-03-06T22:59:59.999Z',
      });

      const todayPostsResponse = await Api.routes.posts.getPosts.waitForRequest(
        {
          beforeAction: async () => {
            // Default page is "today"
            await page.goto('/');
          },
        },
      );

      expect(todayPostsResponse.url()).toContain(
        decodeURIComponent(searchParams.toString()),
      );
      await expect(page).toHaveURL(/.*/);
      await expect(page).toHaveTitle('Home | Smiler');
      await expect(page.getByTestId('posts-container')).toBeVisible();
      for (const post of posts) {
        await expect(page.getByTestId(`post-${post.id}-title`)).toContainText(
          post.title,
        );
      }
    });

    test('Feed link is disabled if user is not logged in', async ({
      page,
      isMobile,
    }) => {
      // eslint-disable-next-line playwright/no-conditional-in-test
      if (isMobile) {
        page.getByTestId('mobile-menu').click();
      }

      await expect(page.getByTestId('feed-link')).toHaveAttribute(
        'title',
        'Log in to access this page',
      );
    });
  });

  test.describe('Requires auth', () => {
    test.beforeEach(async ({ page, Api }) => {
      Api.routes.auth.getAuth.mock({
        body: generateAuth({
          isAuth: true,
        }),
      });

      await page.goto('/');
    });

    test("Fetches current user's feed", async ({ page, Api, isMobile }) => {
      Api.routes.posts.getFeed.mock({
        body: {
          pages: 0,
          posts,
        },
      });

      const searchParams = new URLSearchParams({
        limit: '20',
        offset: '0',
      });

      const feedResponse = await Api.routes.posts.getPosts.waitForRequest({
        beforeAction: async () => {
          await clickPostGroup({
            group: 'feed-link',
            isMobile,
            page,
          });
        },
      });

      expect(feedResponse.url()).toContain(searchParams.toString());
      await expect(page).toHaveURL(/.*\/feed/);
      await expect(page).toHaveTitle('Feed | Smiler');
      await expect(page.getByTestId('posts-container')).toBeVisible();
      for (const post of posts) {
        await expect(page.getByTestId(`post-${post.id}-title`)).toContainText(
          post.title,
        );
      }
    });
  });
});

test.describe('Post votes', () => {
  let dataTestIds;

  test.beforeAll(async ({ isMobile }) => {
    // TODO: Introduce page object to make it better
    dataTestIds = {
      upvote: `${isMobile ? 'm-' : ''}post-${post1.id}-upvote`,
      downvote: `${isMobile ? 'm-' : ''}post-${post1.id}-downvote`,
    };
  });

  test.beforeEach(async ({ Api }) => {
    Api.routes.posts.updateRateById.mock({
      status: 200,
    });

    Api.routes.posts.removeRateById.mock({
      status: 200,
    });
  });

  test('Upvotes a post', async ({ page, Api }) => {
    await page.goto('/');
    await page.getByTestId(`post-${post1.id}-title`).isVisible();

    const upvoteResponse = await Api.routes.posts.updateRateById.waitForRequest(
      {
        beforeAction: async () => {
          await page.getByTestId(dataTestIds.upvote).click();
        },
      },
    );

    expect(upvoteResponse.url()).toContain(post1.id);
    expect(upvoteResponse.postDataJSON()).toEqual({
      negative: false,
    });
    await expect(page.getByTestId(dataTestIds.upvote)).toHaveClass(
      /post-side__upvote_active/,
    );
  });

  test('Downvotes a post', async ({ page, Api }) => {
    await page.goto('/');
    await page.getByTestId(`post-${post1.id}-title`).isVisible();

    const downvoteResponse =
      await Api.routes.posts.updateRateById.waitForRequest({
        beforeAction: async () => {
          await page.getByTestId(dataTestIds.downvote).click();
        },
      });

    expect(downvoteResponse.url()).toContain(post1.id);
    expect(downvoteResponse.postDataJSON()).toEqual({
      negative: true,
    });
    await expect(page.getByTestId(dataTestIds.downvote)).toHaveClass(
      /post-side__downvote_active/,
    );
  });

  test('Removes a vote from a post if it was upvoted before', async ({
    page,
    Api,
  }) => {
    Api.routes.posts.getPosts.mock({
      body: {
        pages: 0,
        posts: [
          {
            ...post1,
            rated: {
              isRated: true,
              negative: false,
            },
          },
        ],
      },
    });

    await page.goto('/');

    await expect(page.getByTestId(dataTestIds.upvote)).toHaveClass(
      /post-side__upvote_active/,
    );

    const removeUpvoteResponse =
      await Api.routes.posts.removeRateById.waitForRequest({
        beforeAction: async () => {
          await page.getByTestId(dataTestIds.downvote).click();
        },
      });

    expect(removeUpvoteResponse.url()).toContain(post1.id);
    await expect(page.getByTestId(dataTestIds.upvote)).not.toHaveClass(
      /post-side__upvote_active/,
    );
  });

  test('Removes a vote from a post if it was downvoted before', async ({
    page,
    Api,
  }) => {
    Api.routes.posts.getPosts.mock({
      body: {
        pages: 0,
        posts: [
          {
            ...post1,
            rated: {
              isRated: true,
              negative: true,
            },
          },
        ],
      },
    });

    await page.goto('/');

    await expect(page.getByTestId(dataTestIds.downvote)).toHaveClass(
      /post-side__downvote_active/,
    );

    const removeDownvoteResponse =
      await Api.routes.posts.removeRateById.waitForRequest({
        beforeAction: async () => {
          await page.getByTestId(dataTestIds.upvote).click();
        },
      });

    expect(removeDownvoteResponse.url()).toContain(post1.id);
    await expect(page.getByTestId(dataTestIds.downvote)).not.toHaveClass(
      /post-side__downvote_active/,
    );
  });
});

test.describe('Sections', () => {
  test('Shows text section', async ({ Api, page }) => {
    const section = {
      hash: '1',
      type: 'text',
      content: 'test',
    };

    const post = generatePost({
      sections: [section],
    });

    Api.routes.posts.getPosts.mock({
      body: {
        pages: 0,
        posts: [post],
      },
    });

    await page.goto('/');

    await expect(
      page.getByTestId(`post-${post.id}-text-${section.hash}`),
    ).toContainText(section.content);
  });

  test('Shows pic section', async ({ Api, page }) => {
    const section = {
      hash: '2',
      type: 'pic',
      url: 'test',
    };

    const post = generatePost({
      sections: [section],
    });

    Api.routes.posts.getPosts.mock({
      body: {
        pages: 0,
        posts: [post],
      },
    });

    await page.goto('/');

    await expect(
      page.getByTestId(`post-${post.id}-pic-${section.hash}`),
    ).toBeVisible();
    await expect(
      page.getByTestId(`post-${post.id}-pic-${section.hash}`),
    ).toHaveAttribute('alt', section.url);
  });

  test('Shows video section', async ({ Api, page }) => {
    const section = {
      hash: '3',
      type: 'vid',
      url: 'test',
    };

    const post = generatePost({
      sections: [section],
    });

    Api.routes.posts.getPosts.mock({
      body: {
        pages: 0,
        posts: [post],
      },
    });

    await page.goto('/');

    await expect(
      page.getByTestId(`post-${post.id}-vid-${section.hash}`),
    ).toBeVisible();
    await expect(
      page.getByTestId(`post-${post.id}-vid-${section.hash}`),
    ).toHaveAttribute('src', section.url);
  });

  test('Shows multiple sections', async ({ Api, page }) => {
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

    const post = generatePost({
      sections,
    });

    Api.routes.posts.getPosts.mock({
      body: {
        pages: 0,
        posts: [post],
      },
    });

    await page.goto('/');

    await expect(
      page.getByTestId(`post-${post.id}-pic-${sections[0].hash}`),
    ).toBeVisible();
    await expect(
      page.getByTestId(`post-${post.id}-pic-${sections[0].hash}`),
    ).toHaveAttribute('alt', sections[0].url);
    await expect(
      page.getByTestId(`post-${post.id}-text-${sections[1].hash}`),
    ).toContainText(sections[1].content);
    await expect(
      page.getByTestId(`post-${post.id}-vid-${sections[2].hash}`),
    ).toBeVisible();
    await expect(
      page.getByTestId(`post-${post.id}-vid-${sections[2].hash}`),
    ).toHaveAttribute('src', sections[2].url);
  });
});
