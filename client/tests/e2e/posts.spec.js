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

test('Shows post categories in the header and clicking them loads posts with the expected filters', async ({ page, isMobile }) => {
  async function clickCategory(category) {
    if (isMobile) {
      page.getByTestId('mobile-menu').click();
    }
    await page.getByTestId(category).click();
  }

  await page.goto('/');

  await Promise.all([
    clickCategory('all-link'),
    page.waitForRequest((res) => res.url().includes('/posts?limit=20&offset=0&sort=-rating')),
  ]);
  await expect(page).toHaveURL(/.*posts\/all/);

  await Promise.all([
    clickCategory('blowing-link'),
    page.waitForRequest((res) => res.url().includes('/posts?limit=20&offset=0&sort=-rating&ratingFrom=50')),
  ]);
  await expect(page).toHaveURL(/.*posts\/blowing/);

  await Promise.all([
    clickCategory('top-this-week-link'),
    page.waitForRequest((res) => res.url().includes('/posts?limit=20&offset=0&sort=-createdAt')),
  ]);
  await expect(page).toHaveURL(/.*posts\/top-this-week/);

  await Promise.all([
    clickCategory('new-link'),
    page.waitForRequest((res) => res.url().includes('/posts?limit=20&offset=0&sort=-createdAt')),
  ]);
  await expect(page).toHaveURL(/.*posts\/new/);

  await Promise.all([
    clickCategory('today-link'),
    page.waitForRequest((res) => res.url().includes('/posts?limit=20&offset=0&sort=-rating')),
  ]);
  await expect(page).toHaveURL(/.*/);
});

test('Rates a post in the list (upvote/downvote/removing vote)', async ({ page, context, isMobile }) => {
  // TODO: Introduce page object to make it better
  const dataTestIds = {
    upvote: `${isMobile ? 'm-' : ''}post-${post1.id}-upvote`,
    downvote: `${isMobile ? 'm-' : ''}post-${post1.id}-downvote`,
  };

  await context.route(`*/**/posts/${post1.id}/rate`, async (route) => {
    await route.fulfill({
      status: 200,
    });
  });

  await page.goto('/');

  await page.getByTestId(`post-${post1.id}-title`).isVisible();

  // eslint-disable-next-line no-unused-vars
  const [upvoteLocator, upvoteRequest] = await Promise.all([
    page.getByTestId(dataTestIds.upvote).click(),
    page.waitForRequest((res) => res.url().includes(`/posts/${post1.id}/rate`) && res.method() === 'PUT'),
  ]);

  expect(upvoteRequest.postDataJSON()).toEqual({
    negative: false,
  });

  // eslint-disable-next-line no-unused-vars
  const [removeVoteLocator1, removeVoteRequest1] = await Promise.all([
    page.getByTestId(dataTestIds.downvote).click(),
    page.waitForRequest((res) => res.url().includes(`/posts/${post1.id}/rate`) && res.method() === 'DELETE'),
  ]);

  // eslint-disable-next-line no-unused-vars
  const [downvoteLocator, downvoteRequest] = await Promise.all([
    page.getByTestId(dataTestIds.downvote).click(),
    page.waitForRequest((res) => res.url().includes(`/posts/${post1.id}/rate`) && res.method() === 'PUT'),
  ]);

  expect(downvoteRequest.postDataJSON()).toEqual({
    negative: true,
  });

  // eslint-disable-next-line no-unused-vars
  const [removeVoteLocator2, removeVoteRequest2] = await Promise.all([
    page.getByTestId(dataTestIds.upvote).click(),
    page.waitForRequest((res) => res.url().includes(`/posts/${post1.id}/rate`) && res.method() === 'DELETE'),
  ]);
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
