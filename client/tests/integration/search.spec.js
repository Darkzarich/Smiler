/* eslint-disable no-await-in-loop */
// @ts-check
import { expect } from '@playwright/test';
import generateAuth from './factory/auth';
import generatePost from './factory/post';
import test from './page-objects';

const post = generatePost({
  id: '1',
});

test.beforeEach(async ({ Api }) => {
  Api.routes.auth.getAuth.mock({
    body: generateAuth(),
  });

  Api.routes.posts.getPosts.mock({
    body: {
      pages: 0,
      posts: [post],
    },
  });
});

test('Searches posts using the search bar', async ({ page, Api }) => {
  await page.goto('/');

  await page.getByTestId('header-search-input').fill('test');

  const postsResponse = await Api.routes.posts.getPosts.waitForRequest({
    beforeAction: async () => {
      await page.getByTestId('header-search-input').press('Enter');
    },
  });

  expect(postsResponse.url()).toContain('title=test');
  await expect(page).toHaveTitle('Search | Smiler');
  await expect(page).toHaveURL(/\/posts\/search\?.*title=test/);
  await expect(page.getByTestId('search-form-input')).toHaveValue('test');
});

test("Doesn't send posts request when just opened search page", async ({
  page,
  Api,
}) => {
  // TODO: Move this logic to the page object
  let isPostsRequestSent = false;

  page.on('request', (req) => {
    if (req.url().includes(`api${Api.routes.posts.getPosts.url}`)) {
      console.log(req.url());
      isPostsRequestSent = true;
    }
  });

  await page.goto('/posts/search');

  await expect(page).toHaveTitle('Search | Smiler');
  await expect(page).toHaveURL('posts/search');
  await expect(page.getByTestId('posts-container')).toBeHidden();
  expect(isPostsRequestSent).toBe(false);
});

test('Searches posts by title using search page', async ({ page, Api }) => {
  await page.goto('/posts/search');

  await page.getByTestId('search-form-input').fill('test');

  const postsResponse = await Api.routes.posts.getPosts.waitForRequest({
    beforeAction: async () => {
      await page.getByTestId('search-form-input').press('Enter');
    },
  });

  expect(postsResponse.url()).toContain('title=test');
  await expect(page).toHaveTitle('Search | Smiler');
  await expect(page).toHaveURL(/\/posts\/search\?.*title=test/);
});

test('Searches posts by dateTo and dateFrom', async ({ page, Api }) => {
  const dates = {
    from: '2000-01-01',
    to: '2000-01-05',
  };

  await page.goto('/posts/search');

  await page.getByTestId('search-form-date-from').fill(dates.from);
  await page.getByTestId('search-form-date-to').fill(dates.to);

  const postsResponse = await Api.routes.posts.getPosts.waitForRequest({
    beforeAction: async () => {
      await page.getByTestId('search-form-input').press('Enter');
    },
  });

  expect(postsResponse.url()).toContain(
    `dateFrom=${dates.from}&dateTo=${dates.to}`,
  );
  await expect(page).toHaveTitle('Search | Smiler');
  await expect(page).toHaveURL(
    new RegExp(`/posts/search?.*dateFrom=${dates.from}&dateTo=${dates.to}`),
  );
});

test('Searches posts by ratingFrom and ratingTo', async ({ page, Api }) => {
  const ratings = {
    from: -500,
    to: 500,
  };

  await page.goto('/posts/search');

  await page
    .getByTestId('search-form-rating-from')
    .fill(ratings.from.toString());
  await page.getByTestId('search-form-rating-to').fill(ratings.to.toString());

  const postsResponse = await Api.routes.posts.getPosts.waitForRequest({
    beforeAction: async () => {
      await page.getByTestId('search-form-input').press('Enter');
    },
  });

  expect(postsResponse.url()).toContain(
    `ratingFrom=${ratings.from}&ratingTo=${ratings.to}`,
  );
  await expect(page).toHaveTitle('Search | Smiler');
  await expect(page).toHaveURL(
    new RegExp(
      `/posts/search?.*ratingFrom=${ratings.from}&ratingTo=${ratings.to}`,
    ),
  );
});

test('Searches posts by tags', async ({ page, Api }) => {
  await page.goto('/posts/search');

  const tags = ['tag1', 'tag2'];
  const requestQueryTags = tags.map((t) => `tags[]=${t}`).join('&');
  const urlTags = tags.map((t) => `tags=${t}`).join('&');

  for (const tag of tags) {
    await page.getByTestId('post-tag-input').fill(tag);
    await page.getByTestId('post-tag-input').press('Enter');
  }

  const postsResponse = await Api.routes.posts.getPosts.waitForRequest({
    beforeAction: async () => {
      await page.getByTestId('search-form-input').press('Enter');
    },
  });

  expect(postsResponse.url()).toContain(requestQueryTags);
  await expect(page).toHaveTitle('Search | Smiler');
  await expect(page).toHaveURL(new RegExp(`/posts/search?.*${urlTags}`));
});

test('Sets all filters from URL', async ({ page, Api }) => {
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

  const postsResponse = await Api.routes.posts.getPosts.waitForRequest({
    beforeAction: async () => {
      await page.goto(`/posts/search?${searchParams.toString()}`);
    },
  });

  expect(postsResponse.url()).toContain(
    `dateFrom=${filters.dateFrom}&dateTo=${filters.dateTo}`,
  );
  expect(postsResponse.url()).toContain(
    `ratingFrom=${filters.ratingFrom}&ratingTo=${filters.ratingTo}`,
  );
  expect(postsResponse.url()).toContain(`title=${filters.title}`);
  expect(postsResponse.url()).toContain(requestQueryTags);
  await expect(page).toHaveTitle('Search | Smiler');
});

test('Searches posts by clicking on a tag name and then "Search tag" option in the context menu', async ({
  page,
  Api,
}) => {
  const tags = ['test'];

  Api.routes.posts.getPosts.mock({
    body: {
      pages: 0,
      posts: [
        generatePost({
          tags,
        }),
      ],
    },
  });

  await page.goto('/posts/all');

  await page.getByTestId(`post-${post.id}-tag-${tags[0]}`).click();

  const postsResponse = await Api.routes.posts.getPosts.waitForRequest({
    beforeAction: async () => {
      await page
        .getByTestId('context-menu')
        .filter({ has: page.getByText('Search tag') })
        .click();
    },
  });

  expect(postsResponse.url()).toContain(`tags[]=${tags[0]}`);
  await expect(page).toHaveTitle('Search | Smiler');
  await expect(page).toHaveURL(new RegExp(`/posts/search?.*tags=${tags[0]}`));
});

test('Empty posts lists after search', async ({ page, Api }) => {
  Api.routes.posts.getPosts.mock({
    body: {
      pages: 0,
      posts: [],
    },
  });

  await page.goto('/');

  await page.getByTestId('header-search-input').fill('test');
  await page.getByTestId('header-search-input').press('Enter');

  await expect(page.getByTestId('posts-container')).toBeVisible();
  await expect(
    page.getByText("We're sorry. No posts for this time yet."),
  ).toBeVisible();
});
