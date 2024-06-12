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

test('Fetches posts with expected filters', async ({
  PostsPage,
  Post,
  Api,
}) => {
  await Api.routes.posts.getPosts.waitForRequest({
    preRequestAction: PostsPage.goto.bind(PostsPage, PostsPage.urls.today),
  });

  for (const post of posts) {
    await expect(Post.getTitleById(post.id)).toContainText(post.title);
  }
});

test('Empty posts lists', async ({ Api, Post, PostsPage }) => {
  Api.routes.posts.getPosts.mock({
    body: {
      pages: 0,
      posts: [],
    },
  });

  await PostsPage.goto(PostsPage.urls.today);

  await expect(Post.postsList).toBeVisible();
  await expect(Post.getNoContentText()).toBeVisible();
});

test.describe('Post groups', () => {
  test.beforeEach(async ({ context }) => {
    // playwright.config.js has Europe/Amsterdam (GMT+1) timezone set
    await mockDate(context, '2024-03-06T00:00:00.000Z');
  });

  test.describe('Not requiring auth', () => {
    test.beforeEach(async ({ PostsPage, Api, Menu }) => {
      await Api.routes.posts.getPosts.waitForRequest({
        preRequestAction: PostsPage.goto.bind(PostsPage, PostsPage.urls.today),
      });
      await Menu.openIfMobile();
    });

    test('Fetches all posts', async ({
      page: currentPage,
      PostsPage,
      Post,
      Api,
    }) => {
      const searchParams = new URLSearchParams({
        limit: '20',
        offset: '0',
        sort: '-rating',
      });

      const allPostsResponse = await Api.routes.posts.getPosts.waitForRequest({
        preRequestAction: PostsPage.selectPostGroup.bind(
          PostsPage,
          PostsPage.groups.all,
        ),
      });

      expect(allPostsResponse.url()).toContain(searchParams.toString());
      await expect(currentPage).toHaveURL(PostsPage.urls.all);
      await expect(currentPage).toHaveTitle(PostsPage.titles.all);
      await expect(Post.postsList).toBeVisible();
      for (const post of posts) {
        await expect(Post.getTitleById(post.id)).toContainText(post.title);
      }
    });

    test('Fetches "blowing" posts', async ({
      page: currentPage,
      PostsPage,
      Post,
      Api,
    }) => {
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
          preRequestAction: PostsPage.selectPostGroup.bind(
            PostsPage,
            PostsPage.groups.blowing,
          ),
        });

      expect(blowingPostsResponse.url()).toContain(
        decodeURIComponent(searchParams.toString()),
      );
      await expect(currentPage).toHaveURL(PostsPage.urls.blowing);
      await expect(currentPage).toHaveTitle(PostsPage.titles.blowing);
      await expect(Post.postsList).toBeVisible();
      for (const post of posts) {
        await expect(Post.getTitleById(post.id)).toContainText(post.title);
      }
    });

    test('Fetches "top this week" posts', async ({
      page: currentPage,
      PostsPage,
      Post,
      Api,
    }) => {
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
          preRequestAction: PostsPage.selectPostGroup.bind(
            PostsPage,
            PostsPage.groups.topThisWeek,
          ),
        });

      expect(topThisWeekResponse.url()).toContain(
        decodeURIComponent(searchParams.toString()),
      );
      await expect(currentPage).toHaveURL(PostsPage.urls.topThisWeek);
      await expect(currentPage).toHaveTitle(PostsPage.titles.topThisWeek);
      await expect(Post.postsList).toBeVisible();
      for (const post of posts) {
        await expect(Post.getTitleById(post.id)).toContainText(post.title);
      }
    });

    test('Fetches "new" posts', async ({
      page: currentPage,
      PostsPage,
      Post,
      Api,
    }) => {
      const searchParams = new URLSearchParams({
        limit: '20',
        offset: '0',
        sort: '-createdAt',
        // Within two hours from the mocked date
        dateFrom: '2024-03-05T22:00:00.000Z',
      });

      const newPostsResponse = await Api.routes.posts.getPosts.waitForRequest({
        preRequestAction: PostsPage.selectPostGroup.bind(
          PostsPage,
          PostsPage.groups.new,
        ),
      });

      expect(newPostsResponse.url()).toContain(
        decodeURIComponent(searchParams.toString()),
      );
      await expect(currentPage).toHaveURL(PostsPage.urls.new);
      await expect(currentPage).toHaveTitle(PostsPage.titles.new);
      await expect(Post.postsList).toBeVisible();
      for (const post of posts) {
        await expect(Post.getTitleById(post.id)).toContainText(post.title);
      }
    });

    test('Fetches "today" posts', async ({
      page: currentPage,
      PostsPage,
      Post,
      Api,
    }) => {
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
          preRequestAction: PostsPage.goto.bind(
            PostsPage,
            PostsPage.urls.today,
          ),
        },
      );

      expect(todayPostsResponse.url()).toContain(
        decodeURIComponent(searchParams.toString()),
      );
      await expect(currentPage).toHaveURL(PostsPage.urls.today);
      await expect(currentPage).toHaveTitle(PostsPage.titles.today);
      await expect(Post.postsList).toBeVisible();
      for (const post of posts) {
        await expect(Post.getTitleById(post.id)).toContainText(post.title);
      }
    });

    test('Feed link is disabled if user is not logged in', async ({
      PostsPage,
    }) => {
      await expect(PostsPage.getFeedLink()).toHaveAttribute(
        'title',
        'Sign in to access this page',
      );
    });
  });

  test.describe('Requires auth', () => {
    test.beforeEach(async ({ PostsPage, Menu, Api }) => {
      Api.routes.auth.getAuth.mock({
        body: generateAuth({
          isAuth: true,
        }),
      });

      Api.routes.posts.getFeed.mock({
        body: {
          pages: 0,
          posts,
        },
      });

      await PostsPage.goto(PostsPage.urls.today);

      await Menu.openIfMobile();
    });

    test("Fetches current user's feed", async ({
      page: currentPage,
      PostsPage,
      Post,
      Api,
    }) => {
      const searchParams = new URLSearchParams({
        limit: '20',
        offset: '0',
      });

      const feedResponse = await Api.routes.posts.getPosts.waitForRequest({
        preRequestAction: PostsPage.selectPostGroup.bind(
          PostsPage,
          PostsPage.groups.feed,
        ),
      });

      expect(feedResponse.url()).toContain(searchParams.toString());
      await expect(currentPage).toHaveURL(PostsPage.urls.feed);
      await expect(currentPage).toHaveTitle(PostsPage.titles.feed);
      await expect(Post.postsList).toBeVisible();
      for (const post of posts) {
        await expect(Post.getTitleById(post.id)).toContainText(post.title);
      }
    });
  });
});

test.describe('Post votes', () => {
  test.beforeEach(async ({ Api }) => {
    Api.routes.posts.updateRateById.mock({
      status: 200,
    });

    Api.routes.posts.removeRateById.mock({
      status: 200,
    });
  });

  test('Upvotes a post', async ({ Api, Post, PostsPage }) => {
    await PostsPage.goto(PostsPage.urls.today);
    await Post.getTitleById(post1.id).isVisible();

    const upvoteResponse = await Api.routes.posts.updateRateById.waitForRequest(
      {
        preRequestAction: Post.upvotePostById.bind(Post, post1.id),
      },
    );

    expect(upvoteResponse.url()).toContain(post1.id);
    expect(upvoteResponse.postDataJSON()).toEqual({
      negative: false,
    });
    await expect(await Post.getIsPostByIdUpvoted(post1.id)).toBe(true);
  });

  test('Downvotes a post', async ({ Post, PostsPage, Api }) => {
    await PostsPage.goto(PostsPage.urls.today);
    await Post.getTitleById(post1.id).isVisible();

    const downvoteResponse =
      await Api.routes.posts.updateRateById.waitForRequest({
        preRequestAction: Post.downvotePostById.bind(Post, post1.id),
      });

    expect(downvoteResponse.url()).toContain(post1.id);
    expect(downvoteResponse.postDataJSON()).toEqual({
      negative: true,
    });
    await expect(await Post.getIsPostByIdDownvoted(post1.id)).toBe(true);
  });

  test('Removes a vote from a post if it was upvoted before', async ({
    Post,
    PostsPage,
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

    await PostsPage.goto(PostsPage.urls.today);

    await expect(await Post.getIsPostByIdUpvoted(post1.id)).toBe(true);

    const removeUpvoteResponse =
      await Api.routes.posts.removeRateById.waitForRequest({
        preRequestAction: Post.downvotePostById.bind(Post, post1.id),
      });

    expect(removeUpvoteResponse.url()).toContain(post1.id);
    await expect(await Post.getIsPostByIdUpvoted(post1.id)).toBe(false);
  });

  test('Removes a vote from a post if it was downvoted before', async ({
    Post,
    PostsPage,
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

    await PostsPage.goto(PostsPage.urls.today);

    await expect(await Post.getIsPostByIdDownvoted(post1.id)).toBe(true);

    const removeDownvoteResponse =
      await Api.routes.posts.removeRateById.waitForRequest({
        preRequestAction: Post.upvotePostById.bind(Post, post1.id),
      });

    expect(removeDownvoteResponse.url()).toContain(post1.id);
    await expect(await Post.getIsPostByIdDownvoted(post1.id)).toBe(false);
  });
});

test.describe('Sections', () => {
  test('Shows text section', async ({ Post, PostsPage, Api }) => {
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

    await PostsPage.goto(PostsPage.urls.today);

    await expect(
      Post.getTextSectionByHash(post.id, section.hash),
    ).toContainText(section.content);
  });

  test('Shows pic section', async ({ Post, PostsPage, Api }) => {
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

    await PostsPage.goto(PostsPage.urls.today);

    await expect(Post.getPicSectionByHash(post.id, section.hash)).toBeVisible();
    await expect(
      Post.getPicSectionByHash(post.id, section.hash),
    ).toHaveAttribute('alt', section.url);
  });

  test('Shows video section', async ({ Post, PostsPage, Api }) => {
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

    await PostsPage.goto(PostsPage.urls.today);

    await expect(
      Post.getVideoSectionByHash(post.id, section.hash),
    ).toBeVisible();
    await expect(
      Post.getVideoSectionByHash(post.id, section.hash),
    ).toHaveAttribute('src', section.url);
  });

  test('Shows multiple sections', async ({ Post, PostsPage, Api }) => {
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

    await PostsPage.goto(PostsPage.urls.today);

    await expect(
      Post.getPicSectionByHash(post.id, sections[0].hash),
    ).toBeVisible();
    await expect(
      Post.getPicSectionByHash(post.id, sections[0].hash),
    ).toHaveAttribute('alt', sections[0].url);

    await expect(
      Post.getTextSectionByHash(post.id, sections[1].hash),
    ).toContainText(sections[1].content);

    await expect(
      Post.getVideoSectionByHash(post.id, sections[2].hash),
    ).toBeVisible();
    await expect(
      Post.getVideoSectionByHash(post.id, sections[2].hash),
    ).toHaveAttribute('src', sections[2].url);
  });
});
