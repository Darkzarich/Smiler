/* eslint-disable no-await-in-loop */

import { expect } from '@playwright/test';
import test from './page-objects';
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

    test('Fetches "blowing" posts', async ({
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
          PostsPage.groups.blowing,
        ),
      });

      await expect(currentPage).toHaveURL(PostsPage.urls.blowing);
      await expect(currentPage).toHaveTitle(PostsPage.titles.blowing);
      await expect(Post.postsList).toBeVisible();
      for (const post of posts) {
        await expect(Post.getTitleById(post._id)).toContainText(post.title);
      }
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
