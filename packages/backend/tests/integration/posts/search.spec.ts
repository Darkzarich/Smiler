import request from 'supertest';
import { addMilliseconds, subMilliseconds } from 'date-fns';
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
import { POST_TITLE_MAX_LENGTH, POST_MAX_LIMIT } from '@constants/index';

describe('GET /posts', () => {
  it(`Should return status 422 and an expected message for limit greater than ${POST_MAX_LIMIT}`, async () => {
    const response = await request(global.app).get(
      `/api/posts?limit=${POST_MAX_LIMIT + 1}`,
    );

    expect(response.body.error.message).toBe(ERRORS.POST_LIMIT_PARAM_EXCEEDED);
    expect(response.status).toBe(422);
  });

  it('Should return status 422 and an expected message if title length exceeds limit', async () => {
    const response = await request(global.app).get(
      `/api/posts?title=${'a'.repeat(POST_TITLE_MAX_LENGTH + 1)}`,
    );

    expect(response.body.error.message).toBe(
      ERRORS.POST_TITLE_MAX_LENGTH_EXCEEDED,
    );
    expect(response.status).toBe(422);
  });

  it('Should return status 422 and an expected message if date.to is invalid', async () => {
    const response = await request(global.app).get(`/api/posts?dateTo=invalid`);

    expect(response.body.error.message).toBe(ERRORS.POST_SEARCH_INVALID_DATE);
    expect(response.status).toBe(422);
  });

  it('Should return status 422 and an expected message if date.from is invalid', async () => {
    const response = await request(global.app).get(
      `/api/posts?dateFrom=invalid`,
    );

    expect(response.body.error.message).toBe(ERRORS.POST_SEARCH_INVALID_DATE);
    expect(response.status).toBe(422);
  });

  it('Should return empty list of posts if there are no posts', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .get('/api/posts')
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      posts: [],
      total: 0,
      pages: 0,
      hasNextPage: false,
    });
  });

  it('Should return list of posts with the expected structure if there are posts', async () => {
    const otherUser = await UserModel.create(generateRandomUser());

    const post = await PostModel.create(
      generateRandomPost({
        author: otherUser._id,
      }),
    );

    const response = await request(global.app).get('/api/posts');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      posts: [
        {
          id: post._id.toString(),
          title: post.title,
          slug: post.slug,
          author: {
            id: otherUser._id.toString(),
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
      total: 1,
      pages: 1,
      hasNextPage: false,
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

    const response = await request(global.app).get('/api/posts?limit=10');

    expect(response.status).toBe(200);
    expect(response.body.posts).toHaveLength(10);
    expect(response.body).toMatchObject({
      total: 11,
      pages: 2,
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
      '/api/posts?limit=10&offset=10',
    );

    expect(response.status).toBe(200);
    expect(response.body.posts).toHaveLength(1);
    expect(response.body).toMatchObject({
      total: 11,
      pages: 2,
      hasNextPage: false,
    });
  });

  it('Should return posts as rated if user rated them', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

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

    const rate1 = await RateModel.create(
      generateRate({
        target: post1._id,
        negative: true,
        targetModel: RateTargetModel.POST,
      }),
    );

    const rate2 = await RateModel.create(
      generateRate({
        target: post2._id,
        negative: false,
        targetModel: RateTargetModel.POST,
      }),
    );

    await UserModel.findByIdAndUpdate(currentUser.id, {
      $push: { rates: { $each: [rate1._id, rate2._id] } },
    });

    const response = await request(global.app)
      .get('/api/posts')
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
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

  it('Should sort posts by rating descending', async () => {
    await Promise.all([
      PostModel.create(
        generateRandomPost({
          rating: 15,
        }),
      ),
      PostModel.create(
        generateRandomPost({
          rating: 5,
        }),
      ),
      PostModel.create(
        generateRandomPost({
          rating: 10,
        }),
      ),
    ]);

    const response = await request(global.app).get('/api/posts');

    expect(response.status).toBe(200);
    expect(response.body.posts[0].rating).toBe(15);
    expect(response.body.posts[1].rating).toBe(10);
    expect(response.body.posts[2].rating).toBe(5);
  });

  it('Should filter posts by title (found)', async () => {
    await PostModel.create(
      generateRandomPost({
        title: 'title1',
      }),
    );

    const response = await request(global.app).get('/api/posts?title=title1');

    expect(response.status).toBe(200);
    expect(response.body.posts).toHaveLength(1);
    expect(response.body.posts[0].title).toBe('title1');
  });

  it('Should filter posts by title (not found)', async () => {
    await PostModel.create(
      generateRandomPost({
        title: 'title1',
      }),
    );

    const response = await request(global.app).get('/api/posts?title=title2');

    expect(response.status).toBe(200);
    expect(response.body.posts).toHaveLength(0);
  });

  it('Should filter posts by dateFrom (found)', async () => {
    const dateFrom = new Date();
    const futureDate = addMilliseconds(dateFrom, 1);

    await PostModel.create(
      generateRandomPost({
        createdAt: futureDate,
      }),
    );

    const response = await request(global.app).get(
      `/api/posts?dateFrom=${dateFrom.toISOString()}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.posts).toHaveLength(1);
    expect(response.body.posts[0].createdAt).toBe(futureDate.toISOString());
  });

  it('Should filter posts by dateFrom (not found)', async () => {
    const dateFrom = new Date();

    await PostModel.create(
      generateRandomPost({
        createdAt: subMilliseconds(dateFrom, 1),
      }),
    );

    const response = await request(global.app).get(
      `/api/posts?dateFrom=${dateFrom.toISOString()}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.posts).toHaveLength(0);
  });

  it('Should filter posts by dateTo (found)', async () => {
    const dateTo = new Date();
    const pastDate = subMilliseconds(dateTo, 1);

    await PostModel.create(
      generateRandomPost({
        createdAt: pastDate,
      }),
    );

    const response = await request(global.app).get(
      `/api/posts?dateTo=${dateTo.toISOString()}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.posts).toHaveLength(1);
    expect(response.body.posts[0].createdAt).toBe(pastDate.toISOString());
  });

  it('Should filter posts by dateTo (not found)', async () => {
    const dateTo = new Date();

    await PostModel.create(
      generateRandomPost({
        createdAt: addMilliseconds(dateTo, 1).toISOString(),
      }),
    );

    const response = await request(global.app).get(
      `/api/posts?dateTo=${dateTo.toISOString()}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.posts).toHaveLength(0);
  });

  it('Should filter posts by ratingFrom (found)', async () => {
    await PostModel.create(
      generateRandomPost({
        rating: 10,
      }),
    );

    const response = await request(global.app).get(
      `/api/posts?ratingFrom=${10}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.posts).toHaveLength(1);
    expect(response.body.posts[0].rating).toBe(10);
  });

  it('Should filter posts by ratingFrom (not found)', async () => {
    await PostModel.create(
      generateRandomPost({
        rating: 10,
      }),
    );

    const response = await request(global.app).get(
      `/api/posts?ratingFrom=${11}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.posts).toHaveLength(0);
  });

  it('Should filter posts by ratingTo (found)', async () => {
    await PostModel.create(
      generateRandomPost({
        rating: 10,
      }),
    );

    const response = await request(global.app).get(`/api/posts?ratingTo=${10}`);

    expect(response.status).toBe(200);
    expect(response.body.posts).toHaveLength(1);
    expect(response.body.posts[0].rating).toBe(10);
  });

  it('Should filter posts by ratingTo (not found)', async () => {
    await PostModel.create(
      generateRandomPost({
        rating: 10,
      }),
    );

    const response = await request(global.app).get(`/api/posts?ratingTo=${9}`);

    expect(response.status).toBe(200);
    expect(response.body.posts).toHaveLength(0);
  });

  it('Should filter posts by tags (found)', async () => {
    await PostModel.create(
      generateRandomPost({
        tags: ['tag1', 'tag2'],
      }),
    );

    const response = await request(global.app).get('/api/posts?tags[]=tag1');

    expect(response.status).toBe(200);
    expect(response.body.posts).toHaveLength(1);
    expect(response.body.posts[0].tags).toContain('tag1');
  });

  it('Should filter posts by tags (not found)', async () => {
    await PostModel.create(
      generateRandomPost({
        tags: ['tag1', 'tag2'],
      }),
    );

    const response = await request(global.app).get('/api/posts?tags[]=tag3');

    expect(response.status).toBe(200);
    expect(response.body.posts).toHaveLength(0);
  });

  it('Should filter posts by multiple criteria (found)', async () => {
    await PostModel.create(
      generateRandomPost({
        title: 'title1',
        rating: 10,
        tags: ['tag1', 'tag2'],
      }),
    );

    const response = await request(global.app).get(
      '/api/posts?title=title1&ratingFrom=10&tags[]=tag1',
    );

    expect(response.status).toBe(200);
    expect(response.body.posts).toHaveLength(1);
    expect(response.body.posts[0].title).toBe('title1');
    expect(response.body.posts[0].rating).toBe(10);
    expect(response.body.posts[0].tags).toContain('tag1');
  });

  it('Should filter posts by multiple criteria (not found)', async () => {
    await PostModel.create(
      generateRandomPost({
        title: 'title1',
        rating: 10,
        tags: ['tag1', 'tag2'],
      }),
    );

    const response = await request(global.app).get(
      '/api/posts?title=title2&ratingFrom=10&tags[]=tag1',
    );

    expect(response.status).toBe(200);
    expect(response.body.posts).toHaveLength(0);
  });
});
