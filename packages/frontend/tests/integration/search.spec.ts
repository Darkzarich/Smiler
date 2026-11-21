/* eslint-disable no-await-in-loop */
import { expect } from '@playwright/test';
import test from './page-objects';
import createRandomAuth from '@factory/auth';
import createRandomPost from '@factory/post';

const post = createRandomPost();

test.beforeEach(async ({ Api }) => {
  Api.routes.auth.getAuth.mock({
    body: createRandomAuth(),
  });

  Api.routes.posts.getPosts.mock({
    body: {
      posts: [post],
      hasNextPage: false,
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

test('Searches posts using the search button in the header', async ({
  page: currentPage,
  PostsPage,
  SearchPage,
  Menu,
  Api,
}) => {
  await PostsPage.goto();

  await Menu.fillSearchInput('test');

  const postsResponse = await Api.routes.posts.getPosts.waitForRequest({
    preRequestAction: Menu.clickSearchButton.bind(Menu),
  });

  expect(postsResponse.url()).toContain('title=test');
  await expect(currentPage).toHaveTitle(SearchPage.title);
  expect(SearchPage.pageHasTitleQueryParam('test')).toBe(true);
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
  expect(SearchPage.pageHasTitleQueryParam('test')).toBe(true);
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
  expect(SearchPage.pageHasDateQueryParams(dates)).toBe(true);
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
  expect(SearchPage.pageHasRatingQueryParams(ratings)).toBe(true);
});

test('Searches posts with a rating of 0', async ({
  page: currentPage,
  SearchPage,
  Api,
}) => {
  await SearchPage.goto();

  await SearchPage.ratingFrom.fill('0');

  const postsResponse = await Api.routes.posts.getPosts.waitForRequest({
    preRequestAction: SearchPage.submitSearch.bind(SearchPage),
  });

  expect(postsResponse.url()).toContain('ratingFrom=0');
  await expect(currentPage).toHaveURL(/[?&]ratingFrom=0(&|$)/);
});

test('Fits the search form on a 320px phone, labels above their fields', async ({
  page,
  SearchPage,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await SearchPage.goto(
    'dateFrom=2026-01-02&dateTo=2026-10-06&ratingFrom=-1234&ratingTo=56789',
  );

  const form = await page.locator('.search-form').boundingBox();

  for (const name of ['Date from', 'Date to', 'Rating from', 'Rating to']) {
    const field = await page.getByLabel(name).boundingBox();
    const label = await page.getByText(name, { exact: true }).boundingBox();

    expect(label!.y + label!.height).toBeLessThanOrEqual(field!.y);
    expect(label!.x).toBe(field!.x);
    expect(field!.x).toBeGreaterThanOrEqual(form!.x);
    expect(field!.x + field!.width).toBeLessThanOrEqual(form!.x + form!.width);
  }

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test('Searches posts by tags', async ({
  page: currentPage,
  TagsList,
  SearchPage,
  Api,
}) => {
  await SearchPage.goto();

  const tags = ['tag1', 'tag2'];
  const requestQueryTags = tags.map((t) => encodeURI(`tags[]=${t}`)).join('&');

  await TagsList.addEachTag(tags);

  const postsResponse = await Api.routes.posts.getPosts.waitForRequest({
    preRequestAction: SearchPage.submitSearch.bind(SearchPage),
  });

  expect(postsResponse.url()).toContain(requestQueryTags);
  await expect(currentPage).toHaveTitle(SearchPage.title);
  expect(SearchPage.pageHasTagsQueryParams(tags)).toBe(true);
});

test('Sets all filters from URL', async ({
  page: currentPage,
  SearchPage,
  Api,
}) => {
  const tags = ['tag1', 'tag2'];
  const requestQueryTags = tags.map((t) => encodeURI(`tags[]=${t}`)).join('&');

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

  expect(SearchPage.pageHasTitleQueryParam(filters.title)).toBe(true);
  expect(
    SearchPage.pageHasDateQueryParams({
      from: filters.dateFrom,
      to: filters.dateTo,
    }),
  ).toBe(true);
  expect(
    SearchPage.pageHasRatingQueryParams({
      from: filters.ratingFrom,
      to: filters.ratingTo,
    }),
  ).toBe(true);
  expect(SearchPage.pageHasTagsQueryParams(tags)).toBe(true);
  await expect(currentPage).toHaveTitle(SearchPage.title);
  expect(postsResponse.url()).toContain(requestQueryTags);
});

test('Sets a single tag from URL as one tag', async ({
  page: currentPage,
  SearchPage,
  Api,
}) => {
  const postsResponse = await Api.routes.posts.getPosts.waitForRequest({
    preRequestAction: SearchPage.goto.bind(SearchPage, 'tags=cats'),
  });

  expect(postsResponse.url()).toContain(encodeURI('tags[]=cats'));
  await expect(
    currentPage.getByRole('button', { name: /^Remove tag/ }),
  ).toHaveCount(1);
  await expect(currentPage.getByTestId('remove-tag-button-cats')).toBeVisible();
});

test('Searches posts by clicking on a tag name and then "Search tag" option in the context menu', async ({
  Post,
  PostsPage,
  page: currentPage,
  SearchPage,
  Api,
}) => {
  const tags = ['test'];

  const postWithSpecificTags = createRandomPost({
    tags,
  });

  Api.routes.posts.getAll.mock({
    body: {
      posts: [postWithSpecificTags],
      hasNextPage: false,
    },
  });

  await Api.routes.posts.getAll.waitForRequest({
    preRequestAction: PostsPage.goto.bind(Post, PostsPage.urls.all),
  });

  Api.routes.posts.getPosts.mock({
    body: {
      posts: [],
      hasNextPage: false,
    },
  });

  const postsResponse = await Api.routes.posts.getPosts.waitForRequest({
    preRequestAction: Post.searchTag.bind(
      Post,
      postWithSpecificTags._id,
      tags[0],
    ),
  });

  expect(postsResponse.url()).toContain(encodeURI(`tags[]=${tags[0]}`));
  await expect(currentPage).toHaveTitle(SearchPage.title);
  expect(SearchPage.pageHasTagsQueryParams([tags[0]])).toBe(true);
});

test('Empty posts lists after search', async ({
  PostsPage,
  Post,
  Menu,
  Api,
}) => {
  Api.routes.posts.getPosts.mock({
    body: {
      posts: [],
      hasNextPage: false,
    },
  });

  await PostsPage.goto();

  await Menu.fillSearchInput('test');
  await Menu.submitSearch();

  await expect(Post.postsList).toBeVisible();
  await expect(Post.getNoContentText()).toBeVisible();
  await expect(Post.getNoContentText()).toContainText(
    'No posts match these filters',
  );
});

test('Ends a search with the line that everything was shown', async ({
  Api,
  Post,
  SearchPage,
}) => {
  Api.routes.posts.getPosts.mock({
    body: {
      posts: [post],
      hasNextPage: false,
    },
  });

  await SearchPage.goto('title=test');

  await expect(Post.getNoMoreContentText()).toContainText(
    "That's every match.",
  );
});

test('Keeps the results and the place in them on Back from a post', async ({
  page: currentPage,
  SearchPage,
  Post,
  Api,
}) => {
  const results = Array.from({ length: 15 }, () => createRandomPost());
  const opened = results[10]!;
  const listRequests: string[] = [];

  currentPage.on('request', (request) => {
    if (Api.routes.posts.getPosts.getURLRegExp().test(request.url())) {
      listRequests.push(request.url());
    }
  });

  Api.routes.posts.getPosts.mock({
    body: { posts: results, hasNextPage: false },
  });
  Api.routes.comments.getComments.mock({ body: { comments: [] } });

  await SearchPage.goto('title=test');
  await expect(Post.getListedPosts()).toHaveCount(15);
  // Not before: its /posts/* would answer the page's own /posts/search
  Api.routes.posts.getPostBySlug.mock({ body: opened });
  await Post.scrollPostDownTo(opened._id, 200);

  const top = await Post.getPostTopById(opened._id);

  await Post.openPostById(opened._id);
  await expect(currentPage).toHaveURL(new RegExp(opened.slug));
  await currentPage.goBack();

  await expect(Post.getListedPosts()).toHaveCount(15);
  await expect(SearchPage.searchInput).toHaveValue('test');
  await expect
    .poll(async () => Math.abs((await Post.getPostTopById(opened._id))! - top!))
    .toBeLessThanOrEqual(2);
  expect(listRequests).toHaveLength(1);
});

test('Starts a new search from the first page after scrolling', async ({
  page: currentPage,
  SearchPage,
  Post,
  Api,
}) => {
  const firstPage = Array.from({ length: 15 }, () => createRandomPost());
  const secondPage = Array.from({ length: 15 }, () => createRandomPost());
  const found = createRandomPost();
  const requests: URLSearchParams[] = [];

  await currentPage.route(
    Api.routes.posts.getPosts.getURLRegExp(),
    async (route) => {
      const params = new URL(route.request().url()).searchParams;

      requests.push(params);

      if (params.get('title') === 'moon') {
        await route.fulfill({
          json: {
            posts: params.get('offset') === '0' ? [found] : [],
            hasNextPage: false,
          },
        });

        return;
      }

      await route.fulfill({
        json:
          params.get('offset') === '0'
            ? { posts: firstPage, hasNextPage: true }
            : { posts: secondPage, hasNextPage: false },
      });
    },
  );

  await SearchPage.goto('title=test');
  await expect(Post.getListedPosts()).toHaveCount(15);
  await Post.scrollToListEnd();
  await expect(Post.getListedPosts()).toHaveCount(30);

  await SearchPage.searchInput.fill('moon');
  await SearchPage.submitSearch();

  await expect(Post.getListedPosts()).toHaveCount(1);
  await expect(Post.getTitleById(found._id)).toBeVisible();
  expect(requests.at(-1)?.get('title')).toBe('moon');
  expect(requests.at(-1)?.get('offset')).toBe('0');
});

test('Keeps a page of the previous search that answers late out of the results', async ({
  page: currentPage,
  SearchPage,
  Post,
  Api,
  NotificationList,
}) => {
  const firstPage = Array.from({ length: 15 }, () => createRandomPost());
  const latePage = Array.from({ length: 15 }, () => createRandomPost());
  const found = createRandomPost();

  let releaseLatePage = () => {};
  const latePageReleased = new Promise<void>((resolve) => {
    releaseLatePage = resolve;
  });
  let markLatePageHandled = () => {};
  const latePageHandled = new Promise<void>((resolve) => {
    markLatePageHandled = resolve;
  });

  await currentPage.route(
    Api.routes.posts.getPosts.getURLRegExp(),
    async (route) => {
      const params = new URL(route.request().url()).searchParams;

      if (params.get('title') === 'moon') {
        await route.fulfill({ json: { posts: [found], hasNextPage: false } });

        return;
      }

      if (params.get('offset') === '0') {
        await route.fulfill({ json: { posts: firstPage, hasNextPage: true } });

        return;
      }

      await latePageReleased;
      // The page may have aborted it, leaving nothing to answer
      await route
        .fulfill({ json: { posts: latePage, hasNextPage: false } })
        .catch(() => {});
      markLatePageHandled();
    },
  );

  await SearchPage.goto('title=test');
  await expect(Post.getListedPosts()).toHaveCount(15);

  await Api.routes.posts.getPosts.waitForRequest({
    preRequestAction: Post.scrollToListEnd.bind(Post),
  });

  await SearchPage.searchInput.fill('moon');
  await SearchPage.submitSearch();
  await expect(Post.getTitleById(found._id)).toBeVisible();

  releaseLatePage();
  await latePageHandled;
  // Give a late answer the time to reach the list
  await currentPage.evaluate(
    () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      }),
  );

  await expect(Post.getListedPosts()).toHaveCount(1);
  await expect(Post.getTitleById(found._id)).toBeVisible();
  await NotificationList.waitForNoNotifications();
});

test('Shows the search the address names on Back and Forward', async ({
  page: currentPage,
  SearchPage,
  Post,
  Api,
}) => {
  const moonPost = createRandomPost();
  const pixelPost = createRandomPost();
  const requestedTitles: (string | null)[] = [];

  await currentPage.route(
    Api.routes.posts.getPosts.getURLRegExp(),
    async (route) => {
      const title = new URL(route.request().url()).searchParams.get('title');

      requestedTitles.push(title);

      await route.fulfill({
        json: {
          posts: [title === 'moon' ? moonPost : pixelPost],
          hasNextPage: false,
        },
      });
    },
  );

  await SearchPage.goto();

  await SearchPage.searchInput.fill('moon');
  await SearchPage.submitSearch();
  await expect(Post.getTitleById(moonPost._id)).toBeVisible();

  await SearchPage.searchInput.fill('pixel');
  await SearchPage.submitSearch();
  await expect(Post.getTitleById(pixelPost._id)).toBeVisible();

  await currentPage.goBack();

  expect(SearchPage.pageHasTitleQueryParam('moon')).toBe(true);
  await expect(SearchPage.searchInput).toHaveValue('moon');
  await expect(Post.getListedPosts()).toHaveCount(1);
  await expect(Post.getTitleById(moonPost._id)).toBeVisible();

  await currentPage.goForward();

  expect(SearchPage.pageHasTitleQueryParam('pixel')).toBe(true);
  await expect(SearchPage.searchInput).toHaveValue('pixel');
  await expect(Post.getListedPosts()).toHaveCount(1);
  await expect(Post.getTitleById(pixelPost._id)).toBeVisible();

  // Both came back from the copies kept on their history entries
  expect(requestedTitles).toEqual(['moon', 'pixel']);
});

test('Searches again on Submit with the same filters', async ({
  SearchPage,
  Api,
}) => {
  await SearchPage.goto('title=moon');

  const postsResponse = await Api.routes.posts.getPosts.waitForRequest({
    preRequestAction: SearchPage.submitSearch.bind(SearchPage),
  });

  expect(postsResponse.url()).toContain('title=moon');
  expect(postsResponse.url()).toContain('offset=0');
});
