/* eslint-disable no-await-in-loop */
// @ts-check

import { test, expect } from '@playwright/test';
import generateAuth from './fixtures/auth';
import generatePost from './fixtures/post';

const post = generatePost({
  id: '1',
});

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
        posts: [post],
      },
    });
  });
});

test('Searches posts using the search bar', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('header-search-input').fill('test');

  const postsRequest = page.waitForRequest((req) => req.url().includes('/posts') && req.url().includes('title=test'));

  await page.getByTestId('header-search-input').press('Enter');

  await postsRequest;

  await expect(page).toHaveTitle('Search | Smiler');
  await expect(page).toHaveURL(/\/posts\/search\?.*title=test/);
  await expect(page.getByTestId('search-form-input')).toHaveValue('test');
});

test('Doesn\'t send posts request when just opened search page', async ({ page }) => {
  let isPostsRequestSent = false;

  page.on('request', (req) => {
    if (req.url().includes('api/posts')) {
      console.log(req.url());
      isPostsRequestSent = true;
    }
  });

  await page.goto('/posts/search');

  await expect(page).toHaveTitle('Search | Smiler');
  await expect(page).toHaveURL('posts/search');
  await expect(page.getByTestId('posts-container')).not.toBeVisible();
  expect(isPostsRequestSent).toBe(false);
});

test('Searches posts by title using search page', async ({ page }) => {
  await page.goto('/posts/search');

  await page.getByTestId('search-form-input').fill('test');

  const postsRequest = page.waitForRequest((req) => req.url().includes('/posts') && req.url().includes('title=test'));

  await page.getByTestId('search-form-input').press('Enter');

  await postsRequest;

  await expect(page).toHaveTitle('Search | Smiler');
  await expect(page).toHaveURL(/\/posts\/search\?.*title=test/);
});

test('Searches posts by dateTo and dateFrom', async ({ page }) => {
  const dates = {
    from: '2000-01-01',
    to: '2000-01-05',
  };

  await page.goto('/posts/search');

  await page.getByTestId('search-form-date-from').fill(dates.from);
  await page.getByTestId('search-form-date-to').fill(dates.to);

  const postsRequest = page.waitForRequest((req) => req.url().includes('/posts')
    && req.url().includes(`dateFrom=${dates.from}&dateTo=${dates.to}`));

  await page.getByTestId('search-form-input').press('Enter');

  await postsRequest;

  await expect(page).toHaveTitle('Search | Smiler');
  await expect(page).toHaveURL(new RegExp(`/posts/search?.*dateFrom=${dates.from}&dateTo=${dates.to}`));
});

test('Searches posts by ratingFrom and ratingTo', async ({ page }) => {
  const ratings = {
    from: -500,
    to: 500,
  };

  await page.goto('/posts/search');

  await page.getByTestId('search-form-rating-from').fill(ratings.from.toString());
  await page.getByTestId('search-form-rating-to').fill(ratings.to.toString());

  const postsRequest = page.waitForRequest((req) => req.url().includes('/posts')
    && req.url().includes(`ratingFrom=${ratings.from}&ratingTo=${ratings.to}`));

  await page.getByTestId('search-form-input').press('Enter');

  await postsRequest;

  await expect(page).toHaveTitle('Search | Smiler');
  await expect(page).toHaveURL(new RegExp(`/posts/search?.*ratingFrom=${ratings.from}&ratingTo=${ratings.to}`));
});

test('Searches posts by tags', async ({ page }) => {
  await page.goto('/posts/search');

  const tags = ['tag1', 'tag2'];
  const requestQueryTags = tags.map((t) => `tags[]=${t}`).join('&');
  const urlTags = tags.map((t) => `tags=${t}`).join('&');

  for (const tag of tags) {
    await page.getByTestId('post-tag-input').fill(tag);
    await page.getByTestId('post-tag-input').press('Enter');
  }

  const postsRequest = page.waitForRequest((req) => req.url().includes('/posts')
    && req.url().includes(requestQueryTags));

  await page.getByTestId('search-form-input').press('Enter');

  await postsRequest;

  await expect(page).toHaveTitle('Search | Smiler');
  await expect(page).toHaveURL(new RegExp(`/posts/search?.*${urlTags}`));
});

test('Sets all filters from URL', async ({ page }) => {
  const tags = ['tag1', 'tag2'];
  const requestQueryTags = tags.map((t) => `tags[]=${t}`).join('&');

  const filters = {
    title: 'test',
    dateFrom: '2000-01-02',
    dateTo: '2000-01-06',
    ratingFrom: '-50',
    ratingTo: '50',
  };

  const searchParams = new URLSearchParams(filters);
  // Array for URLSearchParams doesn't work properly so have to use append
  searchParams.append('tags', tags[0]);
  searchParams.append('tags', tags[1]);

  const postsRequest = page.waitForRequest(
    (req) => req.url().includes('/posts')
    && req.url().includes(requestQueryTags)
    && req.url().includes(`title=${filters.title}`)
    && req.url().includes(`dateFrom=${filters.dateFrom}&dateTo=${filters.dateTo}`)
    && req.url().includes(`ratingFrom=${filters.ratingFrom}&ratingTo=${filters.ratingTo}`)
  );

  await page.goto(`/posts/search?${searchParams.toString()}`);

  await postsRequest;

  await expect(page).toHaveTitle('Search | Smiler');
});

test('Searches posts by clicking on a tag name and then "Search tag" option in the context menu', async ({ page, context }) => {
  const tags = ['test'];

  await context.route('*/**/posts*', async (route) => {
    await route.fulfill({
      json: {
        pages: 0,
        posts: [generatePost({
          tags,
        })],
      },
    });
  });

  await page.goto('/posts/all');

  await page.getByTestId(`post-${post.id}-tag-${tags[0]}`).click();

  const postsRequest = page.waitForRequest((req) => req.url().includes('/posts')
  && req.url().includes(`tags[]=${tags[0]}`));

  await page.getByTestId('context-menu').filter({ has: page.getByText('Search tag') }).click();

  await postsRequest;

  await expect(page).toHaveTitle('Search | Smiler');
  await expect(page).toHaveURL(new RegExp(`/posts/search?.*tags=${tags[0]}`));
});

test('Empty posts lists after search', async ({ page, context }) => {
  await context.route('*/**/posts*', async (route) => {
    await route.fulfill({
      json: {
        pages: 0,
        posts: [],
      },
    });
  });

  await page.goto('/');

  await page.getByTestId('header-search-input').fill('test');
  await page.getByTestId('header-search-input').press('Enter');

  await expect(page.getByTestId('posts-container')).toBeVisible();
  await expect(page.getByText('We\'re sorry. No posts for this time yet.')).toBeVisible();
});
