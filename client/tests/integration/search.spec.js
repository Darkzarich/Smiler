/* eslint-disable no-await-in-loop */
import { expect } from '@playwright/test';
import createRandomAuth from './factory/auth';
import createRandomPost from './factory/post';
import test from './page-objects';

const post = createRandomPost({
  id: '1',
});

test.beforeEach(async ({ Api }) => {
  Api.routes.auth.getAuth.mock({
    body: createRandomAuth(),
  });

  Api.routes.posts.getPosts.mock({
    body: {
      pages: 0,
      posts: [post],
    },
  });
});

test('Searches posts using the search bar in the header', async ({
  page: currentPage,
  PostsPage,
  SearchPage,
  Menu,
  Api,
}) => {
  await PostsPage.goto();

  await Menu.fillSearchInput('test');

  const postsResponse = await Api.routes.posts.getPosts.waitForRequest({
    preRequestAction: Menu.submitSearch.bind(Menu),
  });

  expect(postsResponse.url()).toContain('title=test');
  await expect(currentPage).toHaveTitle(SearchPage.title);
  expect(SearchPage.pageHasTitleQueryParam('test')).toBe(true);
  await expect(SearchPage.searchInput).toHaveValue('test');
});

test("Doesn't send posts request when just opened the search page", async ({
  page: currentPage,
  SearchPage,
  Post,
  Api,
}) => {
  const checkWasRequestSent =
    Api.routes.posts.getPosts.watchIfRequestWasCalled();

  await SearchPage.goto();

  await expect(currentPage).toHaveTitle(SearchPage.title);
  await expect(currentPage).toHaveURL(SearchPage.url);
  await expect(Post.postsList).toBeHidden();
  expect(checkWasRequestSent()).toBe(false);
});

test('Searches posts by title using search page', async ({
  page: currentPage,
  SearchPage,
  Api,
}) => {
  await SearchPage.goto();

  await SearchPage.searchInput.fill('test');

  const postsResponse = await Api.routes.posts.getPosts.waitForRequest({
    preRequestAction: SearchPage.submitSearch.bind(SearchPage),
  });

  expect(postsResponse.url()).toContain('title=test');
  await expect(currentPage).toHaveTitle(SearchPage.title);
  await expect(SearchPage.pageHasTitleQueryParam('test')).toBe(true);
});

test('Searches posts by dateTo and dateFrom', async ({
  page: currentPage,
  SearchPage,
  Api,
}) => {
  const dates = {
    from: '2000-01-01',
    to: '2000-01-05',
  };

  await SearchPage.goto();

  await SearchPage.dateFrom.fill(dates.from);
  await SearchPage.dateTo.fill(dates.to);

  const postsResponse = await Api.routes.posts.getPosts.waitForRequest({
    preRequestAction: SearchPage.submitSearch.bind(SearchPage),
  });

  expect(postsResponse.url()).toContain(
    `dateFrom=${dates.from}&dateTo=${dates.to}`,
  );
  await expect(currentPage).toHaveTitle(SearchPage.title);
  await expect(SearchPage.pageHasDateQueryParams(dates)).toBe(true);
});

test('Searches posts by ratingFrom and ratingTo', async ({
  page: currentPage,
  SearchPage,
  Api,
}) => {
  const ratings = {
    from: -500,
    to: 500,
  };

  await SearchPage.goto();

  await SearchPage.ratingFrom.fill(ratings.from.toString());
  await SearchPage.ratingTo.fill(ratings.to.toString());

  const postsResponse = await Api.routes.posts.getPosts.waitForRequest({
    preRequestAction: SearchPage.submitSearch.bind(SearchPage),
  });

  expect(postsResponse.url()).toContain(
    `ratingFrom=${ratings.from}&ratingTo=${ratings.to}`,
  );
  await expect(currentPage).toHaveTitle(SearchPage.title);
  await expect(SearchPage.pageHasRatingQueryParams(ratings)).toBe(true);
});

test('Searches posts by tags', async ({
  page: currentPage,
  TagsList,
  SearchPage,
  Api,
}) => {
  await SearchPage.goto();

  const tags = ['tag1', 'tag2'];
  const requestQueryTags = tags.map((t) => `tags[]=${t}`).join('&');

  await TagsList.addEachTag(tags);

  const postsResponse = await Api.routes.posts.getPosts.waitForRequest({
    preRequestAction: SearchPage.submitSearch.bind(SearchPage),
  });

  expect(postsResponse.url()).toContain(requestQueryTags);
  await expect(currentPage).toHaveTitle(SearchPage.title);
  await expect(SearchPage.pageHasTagsQueryParams(tags)).toBe(true);
});

test('Sets all filters from URL', async ({
  page: currentPage,
  SearchPage,
  Api,
}) => {
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
    preRequestAction: SearchPage.goto.bind(SearchPage, searchParams.toString()),
  });

  await expect(SearchPage.pageHasTitleQueryParam(filters.title)).toBe(true);
  await expect(
    SearchPage.pageHasDateQueryParams({
      from: filters.dateFrom,
      to: filters.dateTo,
    }),
  ).toBe(true);
  await expect(
    SearchPage.pageHasRatingQueryParams({
      from: filters.ratingFrom,
      to: filters.ratingTo,
    }),
  ).toBe(true);
  await expect(SearchPage.pageHasTagsQueryParams(tags)).toBe(true);
  await expect(currentPage).toHaveTitle(SearchPage.title);
  expect(postsResponse.url()).toContain(requestQueryTags);
});

test('Searches posts by clicking on a tag name and then "Search tag" option in the context menu', async ({
  Post,
  PostsPage,
  page: currentPage,
  SearchPage,
  Api,
}) => {
  const tags = ['test'];

  Api.routes.posts.getAll.mock({
    body: {
      pages: 0,
      posts: [
        createRandomPost({
          tags,
        }),
      ],
    },
  });

  await Api.routes.posts.getAll.waitForRequest({
    preRequestAction: PostsPage.goto.bind(Post, PostsPage.urls.all),
  });

  Api.routes.posts.getPosts.mock({
    body: {
      pages: 0,
      posts: [],
    },
  });

  const postsResponse = await Api.routes.posts.getPosts.waitForRequest({
    preRequestAction: Post.searchTag.bind(Post, post.id, tags[0]),
  });

  expect(postsResponse.url()).toContain(`tags[]=${tags[0]}`);
  await expect(currentPage).toHaveTitle(SearchPage.title);
  await expect(SearchPage.pageHasTagsQueryParams([tags[0]])).toBe(true);
});

test('Empty posts lists after search', async ({
  PostsPage,
  Post,
  Menu,
  Api,
}) => {
  Api.routes.posts.getPosts.mock({
    body: {
      pages: 0,
      posts: [],
    },
  });

  await PostsPage.goto();

  await Menu.fillSearchInput('test');
  await Menu.submitSearch();

  await expect(Post.postsList).toBeVisible();
  await expect(Post.getNoContentText()).toBeVisible();
});
