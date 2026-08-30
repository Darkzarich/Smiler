import request from 'supertest';
import { subDays, subSeconds } from 'date-fns';
import { signUpRequest } from '@test-utils/request-auth';
import { PostModel } from '@models/Post';
import { UserModel } from '@models/User';
import { RateModel, RateTargetModel } from '@models/Rate';
import {
  generateRandomPost,
  generateRandomUser,
  generateRate,
} from '@test-data-generators';
import { ERRORS } from '@errors';
import { POST_MAX_LIMIT } from '@constants/index';

describe('GET /posts/categories/recent', () => {
  it(`Should return status 422 and an expected message for limit greater than ${POST_MAX_LIMIT}`, async () => {
    const { sessionCookie, csrfToken } = await signUpRequest(global.app);

    const response = await request(global.app)
      .get(`/api/posts/categories/recent?limit=${POST_MAX_LIMIT + 1}`)
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    expect(response.body.error.message).toBe(ERRORS.POST_LIMIT_PARAM_EXCEEDED);
    expect(response.status).toBe(422);
  });

  it('Should return empty list of posts if there are no posts', async () => {
    const { sessionCookie, csrfToken } = await signUpRequest(global.app);

    const response = await request(global.app)
      .get('/api/posts/categories/recent')
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      posts: [],
      hasNextPage: false,
      nextCursor: null,
    });
  });

  it('Should return empty list of posts if are posts but posted not today', async () => {
    const { sessionCookie, csrfToken } = await signUpRequest(global.app);

    await PostModel.create(
      generateRandomPost({
        createdAt: subDays(new Date(), 2),
      }),
    );

    const response = await request(global.app)
      .get('/api/posts/categories/recent')
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      posts: [],
      hasNextPage: false,
      nextCursor: null,
    });
  });

  it('Should return list of posts with the expected structure if there are posts that fit the criteria', async () => {
    const otherUser = await UserModel.create(generateRandomUser());

    const post = await PostModel.create(
      generateRandomPost({
        author: otherUser._id,
      }),
    );

    const response = await request(global.app).get(
      '/api/posts/categories/recent',
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      posts: [
        {
          _id: post._id.toString(),
          title: post.title,
          slug: post.slug,
          author: {
            _id: otherUser._id.toString(),
            login: otherUser.login,
            avatar: otherUser.avatar,
          },
          sections: post.sections,
          commentCount: post.commentCount,
          rating: post.rating,
          tags: post.tags,
          rated: { isRated: false, negative: false },
          createdAt: post.createdAt.toISOString(),
        },
      ],
      hasNextPage: false,
      nextCursor: null,
    });
  });

  it('Should return more than one page in pagination if there are more than limit posts existing', async () => {
    const posts = Array(11)
      .fill({})
      .map((_, index) =>
        generateRandomPost({
          slug: `slug${index}`,
        }),
      );

    await PostModel.insertMany(posts);

    const response = await request(global.app).get(
      '/api/posts/categories/recent?limit=10',
    );

    expect(response.status).toBe(200);
    expect(response.body.posts).toHaveLength(10);
    expect(response.body).toMatchObject({
      hasNextPage: true,
    });
  });

  it('Should correctly offset pagination', async () => {
    const posts = Array(11)
      .fill({})
      .map((_, index) =>
        generateRandomPost({
          slug: `slug${index}`,
        }),
      );

    await PostModel.insertMany(posts);

    const response = await request(global.app).get(
      '/api/posts/categories/recent?limit=10&offset=10',
    );

    expect(response.status).toBe(200);
    expect(response.body.posts).toHaveLength(1);
    expect(response.body).toMatchObject({
      hasNextPage: false,
    });
  });

  it('Should return posts as rated if user rated them', async () => {
    const { sessionCookie, csrfToken, currentUser } = await signUpRequest(
      global.app,
    );

    const otherUser = await UserModel.create(generateRandomUser());

    const post1 = await PostModel.create(
      generateRandomPost({
        author: otherUser._id,
      }),
    );

    const post2 = await PostModel.create(
      generateRandomPost({
        author: otherUser._id,
      }),
    );

    await RateModel.create(
      generateRate({
        user: currentUser._id,
        target: post1._id,
        negative: true,
        targetModel: RateTargetModel.POST,
      }),
    );

    await RateModel.create(
      generateRate({
        user: currentUser._id,
        target: post2._id,
        negative: false,
        targetModel: RateTargetModel.POST,
      }),
    );
    const response = await request(global.app)
      .get('/api/posts/categories/recent')
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    expect(response.status).toBe(200);
    // Sorted by createdAt descending
    expect(response.body.posts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rated: {
            isRated: true,
            negative: true,
          },
        }),
      ]),
    );
    expect(response.body.posts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rated: {
            isRated: true,
            negative: false,
          },
        }),
      ]),
    );
  });

  it('Should sort posts by createdAt descending', async () => {
    const dates = [
      subSeconds(new Date(), 2),
      subSeconds(new Date(), 1),
      new Date(),
    ];

    await Promise.all([
      PostModel.create(
        generateRandomPost({
          createdAt: dates[2],
        }),
      ),
      PostModel.create(
        generateRandomPost({
          createdAt: dates[1],
        }),
      ),
      PostModel.create(
        generateRandomPost({
          createdAt: dates[0],
        }),
      ),
    ]);

    const response = await request(global.app).get(
      '/api/posts/categories/recent',
    );

    expect(response.status).toBe(200);
    expect(response.body.posts[0].createdAt.toString()).toBe(
      dates[2].toISOString(),
    );
    expect(response.body.posts[1].createdAt.toString()).toBe(
      dates[1].toISOString(),
    );
    expect(response.body.posts[2].createdAt.toString()).toBe(
      dates[0].toISOString(),
    );
  });
  describe('cursor pagination', () => {
    const getRecent = (params = '') =>
      request(global.app).get(`/api/posts/categories/recent${params}`);

    const toIds = (response: { body: { posts: { _id: string }[] } }) =>
      response.body.posts.map((post) => post._id);

    /** Newest first, one second apart, so the expected order is the order the
     * posts are given back in. */
    const createPostsNewestFirst = (count: number) =>
      PostModel.insertMany(
        Array(count)
          .fill({})
          .map((_, index) =>
            generateRandomPost({ createdAt: subSeconds(new Date(), index) }),
          ),
      );

    it('Should walk the whole list by cursor without repeating a post', async () => {
      const posts = await createPostsNewestFirst(5);
      const expectedIds = posts.map((post) => post._id.toString());

      const firstPage = await getRecent('?limit=2');
      const secondPage = await getRecent(
        `?limit=2&cursor=${firstPage.body.nextCursor}`,
      );
      const lastPage = await getRecent(
        `?limit=2&cursor=${secondPage.body.nextCursor}`,
      );

      expect(toIds(firstPage)).toEqual(expectedIds.slice(0, 2));
      expect(toIds(secondPage)).toEqual(expectedIds.slice(2, 4));
      expect(toIds(lastPage)).toEqual(expectedIds.slice(4));
      expect(lastPage.body).toMatchObject({
        hasNextPage: false,
        nextCursor: null,
      });
    });

    it('Should return a null nextCursor on the last page', async () => {
      await createPostsNewestFirst(2);

      const response = await getRecent('?limit=2');

      expect(response.status).toBe(200);
      expect(response.body.posts).toHaveLength(2);
      expect(response.body).toMatchObject({
        hasNextPage: false,
        nextCursor: null,
      });
    });

    it('Should not repeat a post when a newer one is created between two pages', async () => {
      const posts = await createPostsNewestFirst(4);

      const firstPage = await getRecent('?limit=2');

      // The post an offset would shift the whole list by
      await PostModel.create(generateRandomPost({ createdAt: new Date() }));

      const secondPage = await getRecent(
        `?limit=2&cursor=${firstPage.body.nextCursor}`,
      );

      expect(secondPage.status).toBe(200);
      expect(toIds(secondPage)).toEqual([
        posts[2]._id.toString(),
        posts[3]._id.toString(),
      ]);
    });

    it('Should not drop posts sharing one createdAt across a page boundary', async () => {
      const createdAt = subSeconds(new Date(), 1);

      const posts = await PostModel.insertMany(
        Array(4)
          .fill({})
          .map(() => generateRandomPost({ createdAt })),
      );

      const firstPage = await getRecent('?limit=2');
      const secondPage = await getRecent(
        `?limit=2&cursor=${firstPage.body.nextCursor}`,
      );

      const seenIds = [...toIds(firstPage), ...toIds(secondPage)];

      expect(new Set(seenIds).size).toBe(4);
      expect(seenIds.sort()).toEqual(
        posts.map((post) => post._id.toString()).sort(),
      );
    });

    it('Should return status 422 and an expected message for a malformed cursor', async () => {
      const response = await getRecent('?cursor=not-a-cursor');

      expect(response.body.error.message).toBe(
        ERRORS.PAGINATION_INVALID_CURSOR,
      );
      expect(response.status).toBe(422);
    });

    it('Should return status 422 and an expected message when cursor and offset are combined', async () => {
      const firstPage = await getRecent('?limit=1');

      const response = await getRecent(
        `?limit=1&offset=1&cursor=${firstPage.body.nextCursor}`,
      );

      expect(response.body.error.message).toBe(
        ERRORS.PAGINATION_CURSOR_WITH_OFFSET,
      );
      expect(response.status).toBe(422);
    });
  });
});
