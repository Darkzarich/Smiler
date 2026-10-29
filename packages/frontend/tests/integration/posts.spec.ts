/* eslint-disable no-await-in-loop */

import { type Page, expect } from '@playwright/test';
import test from './page-objects';
import type PostComponent from './page-objects/components/Post';
import type PostsPageObject from './page-objects/pages/PostsPage';
import mockDate from './utils/mock-date';
import { postTypes } from '@api/posts';
import createRandomAuth from '@factory/auth';
import createRandomPost from '@factory/post';
import createRandomSection from '@factory/section';

const post1 = createRandomPost({
  rated: {
    isRated: false,
    negative: false,
  },
});

const post2 = createRandomPost({
  rated: {
    isRated: false,
    negative: false,
  },
});

const posts = [post1, post2];

test.beforeEach(async ({ Api }) => {
  Api.routes.auth.getAuth.mock({
    body: createRandomAuth(),
  });

  Api.routes.posts.getToday.mock({
    body: {
      posts,
      hasNextPage: false,
    },
  });
});

test('Fetches posts with expected filters', async ({
  PostsPage,
  Post,
  Api,
}) => {
  await Api.routes.posts.getToday.waitForRequest({
    preRequestAction: PostsPage.goto.bind(PostsPage, PostsPage.urls.today),
  });

  for (const post of posts) {
    await expect(Post.getTitleById(post._id)).toContainText(post.title);
  }
});

test('Empty posts lists', async ({ Api, Post, PostsPage }) => {
  Api.routes.posts.getToday.mock({
    body: {
      posts: [],
      hasNextPage: false,
    },
  });

  await PostsPage.goto(PostsPage.urls.today);

  await expect(Post.postsList).toBeVisible();
  await expect(Post.getNoContentText()).toBeVisible();
  await expect(Post.getNoMoreContentText()).toBeHidden();
});

test('Shows the end of the list only once the last page has loaded', async ({
  Api,
  Post,
  PostsPage,
  context,
}) => {
  const lastPagePost = createRandomPost();

  let releaseLastPage = () => {};
  const lastPageReleased = new Promise<void>((resolve) => {
    releaseLastPage = resolve;
  });

  await context.route(
    Api.routes.posts.getToday.getURLRegExp(),
    async (route) => {
      const offset = new URL(route.request().url()).searchParams.get('offset');

      if (offset === '0') {
        await route.fulfill({ json: { posts, hasNextPage: true } });

        return;
      }

      await lastPageReleased;
      await route.fulfill({
        json: { posts: [lastPagePost], hasNextPage: false },
      });
    },
  );

  await Api.routes.posts.getToday.waitForRequest({
    preRequestAction: PostsPage.goto.bind(PostsPage, PostsPage.urls.today),
  });

  await expect(Post.getTitleById(post1._id)).toBeVisible();
  await expect(Post.getNoMoreContentText()).toBeHidden();

  releaseLastPage();

  await expect(Post.getTitleById(lastPagePost._id)).toBeVisible();
  await expect(Post.getNoMoreContentText()).toBeVisible();
});

test('Fits the post byline and footer on a 320px phone', async ({
  page,
  Api,
  PostsPage,
}) => {
  // The longest login allowed, in the widest letter
  const longPost = createRandomPost({
    author: { login: 'w'.repeat(15) },
    commentCount: 10,
    rating: 12345,
    createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  });

  Api.routes.posts.getToday.mock({
    body: { posts: [longPost], hasNextPage: false },
  });

  await page.setViewportSize({ width: 320, height: 800 });
  await PostsPage.goto(PostsPage.urls.today);

  const card = page.locator('.post__main');

  await expect(card.locator('.post__date')).toHaveText('20 minutes ago');

  const layout = await card.evaluate((el) => {
    const edge = el.getBoundingClientRect();
    const range = document.createRange();

    range.selectNodeContents(el.querySelector('.post__date')!);

    return {
      dateLines: new Set(
        [...range.getClientRects()].map((rect) => Math.round(rect.top)),
      ).size,
      pastEdge: [...el.querySelectorAll('*')]
        .filter((child) => {
          const rect = child.getBoundingClientRect();

          return rect.left < edge.left || rect.right > edge.right + 0.5;
        })
        .map((child) => child.outerHTML.slice(0, 60)),
    };
  });

  expect(layout).toEqual({ dateLines: 1, pastEdge: [] });
});

test('Puts the votes in the footer row and the author above the title on a phone', async ({
  page,
  Api,
  Post,
  PostsPage,
}) => {
  const post = createRandomPost({ commentCount: 10, rating: 12345 });

  Api.routes.posts.getToday.mock({
    body: { posts: [post], hasNextPage: false },
  });

  await page.setViewportSize({ width: 390, height: 800 });
  await PostsPage.goto(PostsPage.urls.today);

  const footer = page.locator('.post__meta-info');
  const commentsCount = Post.getCommentsCountById(post._id);

  await expect(footer.locator(commentsCount)).toBeVisible();

  const middleOf = async (locator: typeof commentsCount) => {
    const box = (await locator.boundingBox())!;

    return Math.round(box.y + box.height / 2);
  };

  const row = await middleOf(commentsCount);

  for (const control of [
    Post.getUpvoteBtnById(post._id),
    Post.getRatingById(post._id),
    Post.getDownvoteBtnById(post._id),
  ]) {
    await expect(footer.locator(control)).toBeVisible();
    expect(await middleOf(control)).toBe(row);
  }

  const author = (await page
    .getByTestId(`post-${post._id}-author`)
    .boundingBox())!;
  const title = (await Post.getTitleById(post._id).boundingBox())!;

  expect(author.y + author.height).toBeLessThanOrEqual(title.y);
});

test('Takes a post deleted from the list off the list', async ({
  page,
  Api,
  Post,
  PostsPage,
  NotificationList,
}) => {
  const auth = createRandomAuth({ isAuth: true });
  const ownPost = createRandomPost({
    author: { _id: auth._id },
    createdAt: new Date().toISOString(),
  });

  Api.routes.auth.getAuth.mock({ body: auth });
  Api.routes.posts.getToday.mock({
    body: { posts: [post1, ownPost, post2], hasNextPage: false },
  });
  Api.routes.posts.deletePostById.mock({ status: 200 });

  await PostsPage.goto(PostsPage.urls.today);
  await expect(Post.getTitleById(ownPost._id)).toBeVisible();

  await Api.routes.posts.deletePostById.waitForRequest({
    preRequestAction: Post.deletePost.bind(Post),
  });

  await expect(NotificationList.root).toHaveText(
    'The post has been successfully deleted',
  );
  await expect(Post.getPostById(ownPost._id)).toHaveCount(0);
  await expect(Post.getListedPosts()).toHaveCount(2);
  await expect(page).toHaveURL(PostsPage.urls.today);
});

test.describe('Post groups', () => {
  test.beforeEach(async ({ context }) => {
    // playwright.config.js has Europe/Amsterdam (GMT+1) timezone set
    await mockDate(context, '2024-03-06T00:00:00.000Z');
  });

  test.describe('Not requiring auth', () => {
    test.beforeEach(async ({ PostsPage, Api, Menu }) => {
      await Api.routes.posts.getToday.waitForRequest({
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
      Api.routes.posts.getAll.mock({
        body: {
          posts,
          hasNextPage: false,
        },
      });

      await Api.routes.posts.getAll.waitForRequest({
        preRequestAction: PostsPage.selectPostGroup.bind(
          PostsPage,
          PostsPage.groups.all,
        ),
      });

      await expect(currentPage).toHaveURL(PostsPage.urls.all);
      await expect(currentPage).toHaveTitle(PostsPage.titles.all);
      await expect(Post.postsList).toBeVisible();
      for (const post of posts) {
        await expect(Post.getTitleById(post._id)).toContainText(post.title);
      }
    });

    test('Fetches "trending" posts', async ({
      page: currentPage,
      PostsPage,
      Post,
      Api,
    }) => {
      Api.routes.posts.getBlowing.mock({
        body: {
          posts,
          hasNextPage: false,
        },
      });

      await Api.routes.posts.getBlowing.waitForRequest({
        preRequestAction: PostsPage.selectPostGroup.bind(
          PostsPage,
          PostsPage.groups.trending,
        ),
      });

      await expect(currentPage).toHaveURL(PostsPage.urls.trending);
      await expect(currentPage).toHaveTitle(PostsPage.titles.trending);
      await expect(Post.postsList).toBeVisible();
      for (const post of posts) {
        await expect(Post.getTitleById(post._id)).toContainText(post.title);
      }
    });

    test('Sends a link to the old "blowing" page to "trending"', async ({
      page: currentPage,
      PostsPage,
      Api,
    }) => {
      Api.routes.posts.getBlowing.mock({
        body: {
          posts,
          hasNextPage: false,
        },
      });

      await Api.routes.posts.getBlowing.waitForRequest({
        preRequestAction: () => currentPage.goto('/posts/blowing'),
      });

      await expect(currentPage).toHaveURL(PostsPage.urls.trending);
      await expect(currentPage).toHaveTitle(PostsPage.titles.trending);
    });

    test('Fetches "top this week" posts', async ({
      page: currentPage,
      PostsPage,
      Post,
      Api,
    }) => {
      Api.routes.posts.getTopThisWeek.mock({
        body: {
          posts,
          hasNextPage: false,
        },
      });

      await Api.routes.posts.getTopThisWeek.waitForRequest({
        preRequestAction: PostsPage.selectPostGroup.bind(
          PostsPage,
          PostsPage.groups.topThisWeek,
        ),
      });

      await expect(currentPage).toHaveURL(PostsPage.urls.topThisWeek);
      await expect(currentPage).toHaveTitle(PostsPage.titles.topThisWeek);
      await expect(Post.postsList).toBeVisible();
      for (const post of posts) {
        await expect(Post.getTitleById(post._id)).toContainText(post.title);
      }
    });

    test('Fetches "new" posts', async ({
      page: currentPage,
      PostsPage,
      Post,
      Api,
    }) => {
      Api.routes.posts.getRecent.mock({
        body: {
          posts,
          hasNextPage: false,
        },
      });

      await Api.routes.posts.getRecent.waitForRequest({
        preRequestAction: PostsPage.selectPostGroup.bind(
          PostsPage,
          PostsPage.groups.new,
        ),
      });

      await expect(currentPage).toHaveURL(PostsPage.urls.new);
      await expect(currentPage).toHaveTitle(PostsPage.titles.new);
      await expect(Post.postsList).toBeVisible();
      for (const post of posts) {
        await expect(Post.getTitleById(post._id)).toContainText(post.title);
      }
    });

    test('Fetches "today" posts', async ({
      page: currentPage,
      PostsPage,
      Post,
      Api,
    }) => {
      await Api.routes.posts.getToday.waitForRequest({
        preRequestAction: PostsPage.goto.bind(PostsPage, PostsPage.urls.today),
      });

      await expect(currentPage).toHaveURL(PostsPage.urls.today);
      await expect(currentPage).toHaveTitle(PostsPage.titles.today);
      await expect(Post.postsList).toBeVisible();
      for (const post of posts) {
        await expect(Post.getTitleById(post._id)).toContainText(post.title);
      }
    });

    test('Asks a visitor to sign in before opening the feed, then opens it', async ({
      page: currentPage,
      PostsPage,
      AuthPrompt,
      Api,
    }) => {
      await PostsPage.getFeedLink().click();

      await expect(AuthPrompt.title).toHaveText('Sign in to see your feed');
      await expect(currentPage).toHaveURL(PostsPage.urls.today);

      const user = createRandomAuth({ isAuth: true });

      // Every guarded navigation asks for the session again
      await Api.routes.auth.getAuth.mock({ body: user });
      await Api.routes.auth.signIn.mock({ body: user });
      await Api.routes.posts.getFeed.mock({
        body: { posts, hasNextPage: false },
      });

      await AuthPrompt.signIn();

      await expect(AuthPrompt.panel).toBeHidden();
      await expect(currentPage).toHaveURL(PostsPage.urls.feed);
    });
  });

  test.describe('Requires auth', () => {
    test.beforeEach(async ({ PostsPage, Menu, Api }) => {
      Api.routes.auth.getAuth.mock({
        body: createRandomAuth({
          isAuth: true,
        }),
      });

      Api.routes.posts.getFeed.mock({
        body: {
          posts,
          hasNextPage: false,
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
        limit: '15',
      });

      const feedResponse = await Api.routes.posts.getFeed.waitForRequest({
        preRequestAction: PostsPage.selectPostGroup.bind(
          PostsPage,
          PostsPage.groups.feed,
        ),
      });

      // The feed pages by cursor, so the first page carries neither an offset
      // nor a cursor
      expect(feedResponse.url()).toContain(searchParams.toString());
      expect(feedResponse.url()).not.toContain('offset');
      expect(feedResponse.url()).not.toContain('cursor');
      await expect(currentPage).toHaveURL(PostsPage.urls.feed);
      await expect(currentPage).toHaveTitle(PostsPage.titles.feed);
      await expect(Post.postsList).toBeVisible();
      for (const post of posts) {
        await expect(Post.getTitleById(post._id)).toContainText(post.title);
      }
    });
  });
});

test.describe('Post votes', () => {
  test.beforeEach(async ({ Api }) => {
    Api.routes.auth.getAuth.mock({
      body: createRandomAuth({ isAuth: true }),
    });

    Api.routes.posts.updateRateById.mock({
      status: 200,
    });

    Api.routes.posts.removeRateById.mock({
      status: 200,
    });
  });

  test('Asks a visitor to sign in instead of sending a vote', async ({
    page: currentPage,
    Api,
    Post,
    PostsPage,
    AuthPrompt,
  }) => {
    Api.routes.auth.getAuth.mock({ body: createRandomAuth() });

    const voteRequests: string[] = [];

    currentPage.on('request', (request) => {
      if (request.url().includes('/vote')) {
        voteRequests.push(request.url());
      }
    });

    await PostsPage.goto(PostsPage.urls.today);
    await Post.upvotePostById(post1._id);

    await expect(AuthPrompt.title).toHaveText('Sign in to vote');
    expect(await Post.getIsPostByIdUpvoted(post1._id)).toBe(false);

    await AuthPrompt.close();
    await Post.downvotePostById(post1._id);

    await expect(AuthPrompt.title).toHaveText('Sign in to vote');
    expect(voteRequests).toEqual([]);
  });

  test("Shows the account's votes on the posts on screen once a visitor signs in", async ({
    Api,
    Post,
    PostsPage,
    AuthPrompt,
  }) => {
    Api.routes.auth.getAuth.mock({ body: createRandomAuth() });
    Api.routes.auth.signIn.mock({ body: createRandomAuth({ isAuth: true }) });
    Api.routes.posts.getMyVotes.mock({
      body: {
        [post1._id]: { isRated: true, negative: false },
        [post2._id]: { isRated: true, negative: true },
      },
    });

    await PostsPage.goto(PostsPage.urls.today);
    await Post.upvotePostById(post1._id);

    const lookup = await Api.routes.posts.getMyVotes.waitForRequest({
      preRequestAction: AuthPrompt.signIn.bind(AuthPrompt),
    });

    expect(new URL(lookup.url()).searchParams.get('ids')).toBe(
      `${post1._id},${post2._id}`,
    );
    await expect(Post.getUpvoteBtnById(post1._id)).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(Post.getDownvoteBtnById(post2._id)).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test.describe('A vote pressed before signing in', () => {
    test.beforeEach(async ({ Api }) => {
      Api.routes.auth.getAuth.mock({ body: createRandomAuth() });
      Api.routes.auth.signIn.mock({
        body: createRandomAuth({ isAuth: true }),
      });
      Api.routes.posts.getMyVotes.mock({ body: {} });
    });

    test('Is sent once the visitor signs in', async ({
      Api,
      Post,
      PostsPage,
      AuthPrompt,
    }) => {
      Api.routes.posts.updateRateById.mock({
        body: { ...post1, rating: post1.rating + 1 },
      });

      await PostsPage.goto(PostsPage.urls.today);
      await Post.downvotePostById(post1._id);

      const voteRequest = await Api.routes.posts.updateRateById.waitForRequest({
        preRequestAction: AuthPrompt.signIn.bind(AuthPrompt),
      });

      expect(voteRequest.url()).toContain(post1._id);
      expect(voteRequest.postDataJSON()).toEqual({ negative: true });
      await expect(Post.getDownvoteBtnById(post1._id)).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });

    // A resumed vote shows on the arrows in the same task that shows the
    // lookup's votes, so once those are on screen the arrows have settled
    test("Doesn't take back the vote the account already had", async ({
      Api,
      Post,
      PostsPage,
      AuthPrompt,
    }) => {
      Api.routes.posts.getMyVotes.mock({
        body: { [post1._id]: { isRated: true, negative: false } },
      });

      const wasVoteRemoved =
        Api.routes.posts.removeRateById.watchIfRequestWasCalled();

      await PostsPage.goto(PostsPage.urls.today);
      await Post.upvotePostById(post1._id);
      await AuthPrompt.signIn();

      await expect(Post.getUpvoteBtnById(post1._id)).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(wasVoteRemoved()).toBe(false);
    });

    test("Isn't sent when the account turns out to be the post's author", async ({
      Api,
      Post,
      PostsPage,
      AuthPrompt,
    }) => {
      Api.routes.auth.signIn.mock({
        body: createRandomAuth({ isAuth: true, _id: post1.author._id }),
      });
      Api.routes.posts.getMyVotes.mock({
        body: { [post2._id]: { isRated: true, negative: true } },
      });

      const wasVoteSent =
        Api.routes.posts.updateRateById.watchIfRequestWasCalled();

      await PostsPage.goto(PostsPage.urls.today);
      await Post.upvotePostById(post1._id);
      await AuthPrompt.signIn();

      await expect(Post.getDownvoteBtnById(post2._id)).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      await expect(Post.getUpvoteBtnById(post1._id)).toHaveAttribute(
        'aria-pressed',
        'false',
      );
      expect(wasVoteSent()).toBe(false);
    });
  });

  test('Clears the votes on screen when the user signs out', async ({
    Api,
    Post,
    PostsPage,
    Menu,
    CurrentUser,
  }) => {
    Api.routes.posts.getToday.mock({
      body: {
        hasNextPage: false,
        posts: [{ ...post1, rated: { isRated: true, negative: false } }],
      },
    });
    Api.routes.auth.logout.mock({ body: { ok: true } });

    // Signing out goes to Home, which is the page already shown
    await PostsPage.goto(PostsPage.urls.today);
    await expect(Post.getUpvoteBtnById(post1._id)).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await Menu.openIfMobile();
    await CurrentUser.clickLogoutBtn();

    await expect(Post.getUpvoteBtnById(post1._id)).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  test('Upvotes a post', async ({ Api, Post, PostsPage }) => {
    Api.routes.posts.updateRateById.mock({
      status: 200,
      body: {
        ...post1,
        // Increases more than the default rate to test using the response data
        rating: post1.rating + 2,
        rated: {
          isRated: true,
          negative: false,
        },
      },
    });

    await PostsPage.goto(PostsPage.urls.today);
    await Post.getTitleById(post1._id).isVisible();

    const upvoteResponse = await Api.routes.posts.updateRateById.waitForRequest(
      {
        preRequestAction: Post.upvotePostById.bind(Post, post1._id),
      },
    );

    expect(upvoteResponse.url()).toContain(post1._id);
    expect(upvoteResponse.postDataJSON()).toEqual({
      negative: false,
    });
    expect(await Post.getIsPostByIdUpvoted(post1._id)).toBe(true);
    await expect(Post.getRatingById(post1._id)).toContainText(
      String(post1.rating + 2),
    );
  });

  test('Downvotes a post', async ({ Post, PostsPage, Api }) => {
    Api.routes.posts.updateRateById.mock({
      status: 200,
      body: {
        ...post1,
        // Decreases more than the default rate to test using the response data
        rating: post1.rating - 2,
        rated: {
          isRated: true,
          negative: true,
        },
      },
    });

    await PostsPage.goto(PostsPage.urls.today);
    await Post.getTitleById(post1._id).isVisible();

    const downvoteResponse =
      await Api.routes.posts.updateRateById.waitForRequest({
        preRequestAction: Post.downvotePostById.bind(Post, post1._id),
      });

    expect(downvoteResponse.url()).toContain(post1._id);
    expect(downvoteResponse.postDataJSON()).toEqual({
      negative: true,
    });
    expect(await Post.getIsPostByIdDownvoted(post1._id)).toBe(true);
    await expect(Post.getRatingById(post1._id)).toContainText(
      String(post1.rating - 2),
    );
  });

  test('Overrides a downvote with an upvote', async ({
    Api,
    Post,
    PostsPage,
  }) => {
    Api.routes.posts.getToday.mock({
      body: {
        hasNextPage: false,
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

    Api.routes.posts.updateRateById.mock({
      status: 200,
      body: {
        ...post1,
        // Increases more than the default rate to test using the response data
        rating: post1.rating + 2,
        rated: {
          isRated: true,
          negative: false,
        },
      },
    });

    await PostsPage.goto(PostsPage.urls.today);
    await Post.getTitleById(post1._id).isVisible();

    const upvoteResponse = await Api.routes.posts.updateRateById.waitForRequest(
      {
        preRequestAction: Post.upvotePostById.bind(Post, post1._id),
      },
    );

    expect(upvoteResponse.url()).toContain(post1._id);
    expect(upvoteResponse.postDataJSON()).toEqual({
      negative: false,
    });
    expect(await Post.getIsPostByIdUpvoted(post1._id)).toBe(true);
    await expect(Post.getRatingById(post1._id)).toContainText(
      String(post1.rating + 2),
    );
  });

  test('Overrides an upvote with a downvote', async ({
    Api,
    Post,
    PostsPage,
  }) => {
    Api.routes.posts.getToday.mock({
      body: {
        hasNextPage: false,
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

    Api.routes.posts.updateRateById.mock({
      status: 200,
      body: {
        ...post1,
        // Increases more than the default rate to test using the response data
        rating: post1.rating + 2,
        rated: {
          isRated: true,
          negative: true,
        },
      },
    });

    await PostsPage.goto(PostsPage.urls.today);
    await Post.getTitleById(post1._id).isVisible();

    const downvoteResponse =
      await Api.routes.posts.updateRateById.waitForRequest({
        preRequestAction: Post.downvotePostById.bind(Post, post1._id),
      });

    expect(downvoteResponse.url()).toContain(post1._id);
    expect(downvoteResponse.postDataJSON()).toEqual({
      negative: true,
    });
    expect(await Post.getIsPostByIdDownvoted(post1._id)).toBe(true);
    await expect(Post.getRatingById(post1._id)).toContainText(
      String(post1.rating + 2),
    );
  });

  test('Removes a vote from a post if it was upvoted before', async ({
    Post,
    PostsPage,
    Api,
  }) => {
    Api.routes.posts.getToday.mock({
      body: {
        hasNextPage: false,
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

    Api.routes.posts.removeRateById.mock({
      status: 200,
      body: {
        ...post1,
        // Decreases more than the default rate to test using the response data
        rating: post1.rating - 2,
        rated: {
          isRated: false,
          negative: false,
        },
      },
    });

    await PostsPage.goto(PostsPage.urls.today);

    expect(await Post.getIsPostByIdUpvoted(post1._id)).toBe(true);

    const removeUpvoteResponse =
      await Api.routes.posts.removeRateById.waitForRequest({
        preRequestAction: Post.upvotePostById.bind(Post, post1._id),
      });

    expect(removeUpvoteResponse.url()).toContain(post1._id);
    expect(await Post.getIsPostByIdUpvoted(post1._id)).toBe(false);
    await expect(Post.getRatingById(post1._id)).toContainText(
      String(post1.rating - 2),
    );
  });

  test('Removes a vote from a post if it was downvoted before', async ({
    Post,
    PostsPage,
    Api,
  }) => {
    Api.routes.posts.getToday.mock({
      body: {
        hasNextPage: false,
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

    Api.routes.posts.removeRateById.mock({
      status: 200,
      body: {
        ...post1,
        // Decreases more than the default rate to test using the response data
        rating: post1.rating + 2,
        rated: {
          isRated: false,
          negative: false,
        },
      },
    });

    await PostsPage.goto(PostsPage.urls.today);

    expect(await Post.getIsPostByIdDownvoted(post1._id)).toBe(true);

    const removeDownvoteResponse =
      await Api.routes.posts.removeRateById.waitForRequest({
        preRequestAction: Post.downvotePostById.bind(Post, post1._id),
      });

    expect(removeDownvoteResponse.url()).toContain(post1._id);
    expect(await Post.getIsPostByIdDownvoted(post1._id)).toBe(false);
    await expect(Post.getRatingById(post1._id)).toContainText(
      String(post1.rating + 2),
    );
  });
});

test.describe('Sections', () => {
  test('Shows text section', async ({ Post, PostsPage, Api }) => {
    const section = createRandomSection(postTypes.POST_SECTION_TYPES.TEXT);

    const post = createRandomPost({
      sections: [section],
    });

    Api.routes.posts.getToday.mock({
      body: {
        posts: [post],
        hasNextPage: false,
      },
    });

    await PostsPage.goto(PostsPage.urls.today);

    await expect(
      Post.getTextSectionByHash(post._id, section.hash),
    ).toContainText(section.content);
  });

  test('Shows pic section', async ({ Post, PostsPage, Api }) => {
    const section = createRandomSection(postTypes.POST_SECTION_TYPES.PICTURE);

    const post = createRandomPost({
      sections: [section],
    });

    Api.routes.posts.getToday.mock({
      body: {
        posts: [post],
        hasNextPage: false,
      },
    });

    await PostsPage.goto(PostsPage.urls.today);

    await expect(
      Post.getPicSectionByHash(post._id, section.hash),
    ).toBeVisible();
    await expect(
      Post.getPicSectionByHash(post._id, section.hash),
    ).toHaveAttribute('src', section.url);
  });

  test('Shows video section', async ({ Post, PostsPage, Api }) => {
    const section = createRandomSection(postTypes.POST_SECTION_TYPES.VIDEO);

    const post = createRandomPost({
      sections: [section],
    });

    Api.routes.posts.getToday.mock({
      body: {
        posts: [post],
        hasNextPage: false,
      },
    });

    await PostsPage.goto(PostsPage.urls.today);

    await expect(
      Post.getVideoSectionByHash(post._id, section.hash),
    ).toBeVisible();
    await expect(
      Post.getVideoSectionByHash(post._id, section.hash),
    ).toHaveAttribute('src', section.url);
  });

  test('Shows multiple sections', async ({ Post, PostsPage, Api }) => {
    const sections = [
      createRandomSection(postTypes.POST_SECTION_TYPES.PICTURE),
      createRandomSection(postTypes.POST_SECTION_TYPES.TEXT),
      createRandomSection(postTypes.POST_SECTION_TYPES.VIDEO),
    ] as [
      postTypes.PostPictureSection,
      postTypes.PostTextSection,
      postTypes.PostVideoSection,
    ];

    const post = createRandomPost({
      sections,
    });

    Api.routes.posts.getToday.mock({
      body: {
        posts: [post],
        hasNextPage: false,
      },
    });

    await PostsPage.goto(PostsPage.urls.today);

    await expect(
      Post.getPicSectionByHash(post._id, sections[0].hash),
    ).toBeVisible();
    await expect(
      Post.getPicSectionByHash(post._id, sections[0].hash),
    ).toHaveAttribute('src', sections[0].url);

    await expect(
      Post.getTextSectionByHash(post._id, sections[1].hash),
    ).toContainText(sections[1].content);

    await expect(
      Post.getVideoSectionByHash(post._id, sections[2].hash),
    ).toBeVisible();
    await expect(
      Post.getVideoSectionByHash(post._id, sections[2].hash),
    ).toHaveAttribute('src', sections[2].url);
  });
});

test.describe('Back from a post', () => {
  // A fresh object each: the factory fills in the overrides it is given
  const createUnratedPost = () =>
    createRandomPost({ rated: { isRated: false, negative: false } });
  const firstPage = Array.from({ length: 15 }, createUnratedPost);
  const secondPage = Array.from({ length: 15 }, createUnratedPost);
  const opened = secondPage[3]!;

  const latePictureUrl = 'https://placehold.co/600x1800';
  const latePicture = createRandomSection(
    postTypes.POST_SECTION_TYPES.PICTURE,
    {
      url: latePictureUrl,
    },
  );

  secondPage[2]!.sections = [latePicture];

  let listRequests: string[];

  test.beforeEach(async ({ Api, context, page: currentPage }) => {
    listRequests = [];

    currentPage.on('request', (request) => {
      if (Api.routes.posts.getToday.getURLRegExp().test(request.url())) {
        listRequests.push(
          new URL(request.url()).searchParams.get('offset') ?? '',
        );
      }
    });

    await context.route(
      Api.routes.posts.getToday.getURLRegExp(),
      async (route) => {
        const offset = new URL(route.request().url()).searchParams.get(
          'offset',
        );

        await route.fulfill({
          json:
            offset === '0'
              ? { posts: firstPage, hasNextPage: true }
              : { posts: secondPage, hasNextPage: false },
        });
      },
    );

    Api.routes.posts.getPostBySlug.mock({ body: opened });
    Api.routes.comments.getComments.mock({ body: { comments: [] } });
  });

  async function openFromSecondPage({
    PostsPage,
    Post,
    page: currentPage,
  }: {
    PostsPage: PostsPageObject;
    Post: PostComponent;
    page: Page;
  }) {
    await PostsPage.goto();
    await expect(Post.getListedPosts()).toHaveCount(15);
    await Post.scrollToListEnd();
    await expect(Post.getListedPosts()).toHaveCount(30);

    await Post.scrollPostDownTo(opened._id, 200);

    const top = await Post.getPostTopById(opened._id);

    await Post.openPostById(opened._id);
    await expect(currentPage).toHaveURL(new RegExp(opened.slug));

    return top;
  }

  test('Keeps the loaded pages and the place in the list', async ({
    Post,
    PostsPage,
    page: currentPage,
  }) => {
    const top = await openFromSecondPage({
      Post,
      PostsPage,
      page: currentPage,
    });

    await currentPage.goBack();

    await expect(Post.getListedPosts()).toHaveCount(30);
    await expect
      .poll(async () =>
        Math.abs((await Post.getPostTopById(opened._id))! - top!),
      )
      .toBeLessThanOrEqual(2);
    expect(listRequests).toEqual(['0', '15']);
  });

  // The picture right above the post loads only after the reader has left, so
  // after Back it grows the page above the post: the saved scrollY is stale
  test('Keeps the place while a picture above it loads', async ({
    Post,
    PostsPage,
    page: currentPage,
  }) => {
    let releasePicture = () => {};
    const pictureReleased = new Promise<void>((resolve) => {
      releasePicture = resolve;
    });

    await currentPage.route(latePictureUrl, async (route) => {
      await pictureReleased;
      // The first visit's request is gone with the page it was for
      await route
        .fulfill({
          contentType: 'image/svg+xml',
          body: '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="1800"/>',
        })
        .catch(() => {});
    });

    const top = await openFromSecondPage({
      Post,
      PostsPage,
      page: currentPage,
    });

    releasePicture();
    await currentPage.goBack();

    await expect
      .poll(() =>
        Post.getPicSectionByHash(secondPage[2]!._id, latePicture.hash).evaluate(
          (img: HTMLImageElement) => img.naturalHeight,
        ),
      )
      .toBe(1800);
    await expect
      .poll(async () =>
        Math.abs((await Post.getPostTopById(opened._id))! - top!),
      )
      .toBeLessThanOrEqual(2);
  });

  test('Fetches page one again on a visit that is not Back', async ({
    Post,
    PostsPage,
    Menu,
    page: currentPage,
  }) => {
    await openFromSecondPage({ Post, PostsPage, page: currentPage });
    await Menu.openIfMobile();
    await PostsPage.selectPostGroup(PostsPage.groups.today);

    await expect(Post.getListedPosts()).toHaveCount(15);
    expect(listRequests).toEqual(['0', '15', '0']);
    expect(await currentPage.evaluate(() => window.scrollY)).toBe(0);
  });

  test('Shows a vote cast on the post page', async ({
    Api,
    Post,
    PostsPage,
    page: currentPage,
  }) => {
    Api.routes.auth.getAuth.mock({ body: createRandomAuth({ isAuth: true }) });
    Api.routes.posts.updateRateById.mock({
      body: { ...opened, rating: opened.rating + 1 },
    });
    // After getPostBySlug, whose /posts/* also matches /posts/votes
    Api.routes.posts.getMyVotes.mock({
      body: { [opened._id]: { isRated: true, negative: false } },
    });

    await openFromSecondPage({ Post, PostsPage, page: currentPage });
    await Post.upvotePostById(opened._id);
    await expect(Post.getUpvoteBtnById(opened._id)).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await currentPage.goBack();

    await expect(Post.getListedPosts()).toHaveCount(30);
    await expect(Post.getUpvoteBtnById(opened._id)).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
