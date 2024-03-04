/* eslint-disable no-await-in-loop */
// @ts-check

import { test, expect } from '@playwright/test';
import generatePost from './fixtures/post';
import generateAuth from './fixtures/auth';

const post1 = generatePost({
  id: '1',
});
const post2 = generatePost({
  id: '2',
});

const posts = [post1, post2];

test.beforeEach(async ({ context }) => {
  await context.route('*/**/users/get-auth', async (route) => {
    await route.fulfill({
      json: generateAuth(),
    });
  });

  await context.route('*/**/posts*', async (route) => {
    await route.fulfill({
      json: {
        pages: 0,
        posts,
      },
    });
  });
});

test('Fetches posts with expected filters', async ({ page }) => {
  await page.goto('/');

  const postRequest = await page.waitForRequest('*/**/posts*');

  // TODO: check for date range as well
  expect(postRequest.url()).toContain('limit=20&offset=0&sort=-rating');

  for (const post of posts) {
    await expect(page.getByTestId(`post-${post.id}-title`)).toContainText(post.title);
  }
});

test.describe('Post groups', async () => {
  async function clickPostGroup({ page, group, isMobile }) {
    if (isMobile) {
      page.getByTestId('mobile-menu').click();
    }
    await page.getByTestId(group).click();
  }

  test.beforeEach(async ({ page, context }) => {
    // playwright.config.js has Europe/Amsterdam (GMT+1) timezone set
    const mockedDate = new Date('2024-03-06T00:00:00.000Z');

    await context.addInitScript(`{
      Date = class extends Date {
        constructor(...args) {
          if (args.length === 0) {
            super(${mockedDate.getTime()})
          } else {
            super(...args)
          }
        }
      }
      
      const __DateNowOffset = ${mockedDate.getTime()} - Date.now()
      const __DateNow = Date.now
      Date.now = () => __DateNow() + __DateNowOffset
    }`);

    await page.goto('/');
  });

  test('Fetches all posts', async ({ page, isMobile }) => {
    const allPostsRequest = page.waitForRequest((res) => res.url().includes('/posts?limit=20&offset=0&sort=-rating'));

    await clickPostGroup({
      group: 'all-link',
      isMobile,
      page,
    });

    await allPostsRequest;
    await expect(page).toHaveURL(/.*posts\/all/);
    await expect(page).toHaveTitle('All Posts');
  });

  test('Fetches "blowing" posts', async ({ page, isMobile }) => {
    // Two hours ago from the mocked date and rating is already at least 50
    const dateFrom = 'dateFrom=2024-03-05T22:00:00.000Z';
    const blowingPostsRequest = page.waitForRequest((res) => res.url().includes(`/posts?limit=20&offset=0&sort=-rating&ratingFrom=50&${dateFrom}`));

    await clickPostGroup({
      group: 'blowing-link',
      isMobile,
      page,
    });

    await blowingPostsRequest;
    await expect(page).toHaveURL(/.*posts\/blowing/);
    await expect(page).toHaveTitle('Blowing');
  });

  test('Fetches "top this week" posts', async ({ page, isMobile }) => {
    // Posts with createdAt starting from the start of this week
    const dateFromTo = 'dateFrom=2024-03-02T23:00:00.000Z&dateTo=2024-03-05T23:00:00.999Z';
    const topThisWeekRequest = page.waitForRequest((res) => res.url().includes(`/posts?limit=20&offset=0&sort=-createdAt&${dateFromTo}`));

    await clickPostGroup({
      group: 'top-this-week-link',
      isMobile,
      page,
    });

    await topThisWeekRequest;
    await expect(page).toHaveURL(/.*posts\/top-this-week/);
    await expect(page).toHaveTitle('Top This Week');
  });

  test('Fetches "new" posts', async ({ page, isMobile }) => {
    // Two hours ago from the mocked date
    const dateFrom = 'dateFrom=2024-03-05T22:00:00.000Z';
    const newPostsRequest = page.waitForRequest((res) => res.url().includes(`/posts?limit=20&offset=0&sort=-createdAt&${dateFrom}`));

    await clickPostGroup({
      group: 'new-link',
      isMobile,
      page,
    });

    await newPostsRequest;
    await expect(page).toHaveURL(/.*posts\/new/);
    await expect(page).toHaveTitle('Recent');
  });

  test('Fetches "today" posts', async ({ page, isMobile }) => {
    const dateFromTo = 'dateFrom=2024-03-05T23:00:00.000Z&dateTo=2024-03-06T22:59:59.999Z';
    const todayPostsRequest = page.waitForRequest((res) => res.url().includes(`/posts?limit=20&offset=0&sort=-rating&${dateFromTo}`));

    await clickPostGroup({
      group: 'today-link',
      isMobile,
      page,
    });

    await todayPostsRequest;
    await expect(page).toHaveURL(/.*/);
    await expect(page).toHaveTitle('Home');
  });
});

test.describe('Post votes', async () => {
  let dataTestIds;

  test.beforeAll(async ({ isMobile }) => {
    // TODO: Introduce page object to make it better
    dataTestIds = {
      upvote: `${isMobile ? 'm-' : ''}post-${post1.id}-upvote`,
      downvote: `${isMobile ? 'm-' : ''}post-${post1.id}-downvote`,
    };
  });

  test.beforeEach(async ({ context }) => {
    await context.route(`*/**/posts/${post1.id}/rate`, async (route) => {
      await route.fulfill({
        status: 200,
      });
    });
  });

  test('Upvotes a post', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId(`post-${post1.id}-title`).isVisible();

    const upvoteRequest = page.waitForRequest((res) => res.url().includes(`/posts/${post1.id}/rate`) && res.method() === 'PUT');

    await page.getByTestId(dataTestIds.upvote).click();
    const upvoteResponse = await upvoteRequest;

    expect(upvoteResponse.postDataJSON()).toEqual({
      negative: false,
    });
  });

  test('Downvotes a post', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId(`post-${post1.id}-title`).isVisible();

    const downvoteRequest = page.waitForRequest((res) => res.url().includes(`/posts/${post1.id}/rate`) && res.method() === 'PUT');

    await page.getByTestId(dataTestIds.downvote).click();
    const downvoteResponse = await downvoteRequest;

    expect(downvoteResponse.postDataJSON()).toEqual({
      negative: true,
    });
  });

  test('Removes a vote from a post if it was upvoted before', async ({ page, context }) => {
    await context.route('*/**/posts*', async (route) => {
      await route.fulfill({
        json: {
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
    });

    await page.goto('/');
    await page.getByTestId(`post-${post1.id}-title`).isVisible();

    const removeUpvoteRequest = page.waitForRequest((res) => res.url().includes(`/posts/${post1.id}/rate`) && res.method() === 'DELETE');

    await page.getByTestId(dataTestIds.downvote).click();

    await removeUpvoteRequest;
  });

  test('Removes a vote from a post if it was downvoted before', async ({ page, context }) => {
    await context.route('*/**/posts*', async (route) => {
      await route.fulfill({
        json: {
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
    });

    await page.goto('/');
    await page.getByTestId(`post-${post1.id}-title`).isVisible();

    const removeDownVoteRequest = page.waitForRequest((res) => res.url().includes(`/posts/${post1.id}/rate`) && res.method() === 'DELETE');

    await page.getByTestId(dataTestIds.upvote).click();

    await removeDownVoteRequest;
  });
});

test.describe('Sections', () => {
  async function mockPostSection(context, section) {
    const post = {
      id: '1',
      sections: Array.isArray(section) ? section : [
        section,
      ],
    };

    await context.route('*/**/api/posts*', async (route) => {
      await route.fulfill({
        json: {
          pages: 0,
          posts: [
            generatePost(post),
          ],
        },
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

    const post = await mockPostSection(context, section);

    await page.goto('/');

    await expect(page.getByTestId(`post-${post.id}-text-${section.hash}`)).toContainText(section.content);
  });

  test('Shows pic section', async ({ context, page }) => {
    const section = {
      hash: '2',
      type: 'pic',
      url: 'test',
    };

    const post = await mockPostSection(context, section);

    await page.goto('/');

    await expect(page.getByTestId(`post-${post.id}-pic-${section.hash}`)).toBeVisible();
    await expect(page.getByTestId(`post-${post.id}-pic-${section.hash}`)).toHaveAttribute('alt', section.url);
  });

  test('Shows video section', async ({ context, page }) => {
    const section = {
      hash: '3',
      type: 'vid',
      url: 'test',
    };

    const post = await mockPostSection(context, section);

    await page.goto('/');

    await expect(page.getByTestId(`post-${post.id}-vid-${section.hash}`)).toBeVisible();
    await expect(page.getByTestId(`post-${post.id}-vid-${section.hash}`)).toHaveAttribute('src', section.url);
  });

  test('Shows multiple sections', async ({ context, page }) => {
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

    const post = await mockPostSection(context, sections);

    await page.goto('/');

    await expect(page.getByTestId(`post-${post.id}-pic-${sections[0].hash}`)).toBeVisible();
    await expect(page.getByTestId(`post-${post.id}-pic-${sections[0].hash}`)).toHaveAttribute('alt', sections[0].url);
    await expect(page.getByTestId(`post-${post.id}-text-${sections[1].hash}`)).toContainText(sections[1].content);
    await expect(page.getByTestId(`post-${post.id}-vid-${sections[2].hash}`)).toBeVisible();
    await expect(page.getByTestId(`post-${post.id}-vid-${sections[2].hash}`)).toHaveAttribute('src', sections[2].url);
  });
});
