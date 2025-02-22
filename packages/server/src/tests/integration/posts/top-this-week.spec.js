import request from 'supertest';
import { startOfWeek, subMilliseconds, subSeconds } from 'date-fns';
import { signUpRequest } from '../../utils/request-auth.js';
import Post from '../../../models/Post.js';
import User from '../../../models/User.js';
import Rate from '../../../models/Rate.js';
import {
  generateRandomPost,
  generateRandomUser,
  generateRate,
} from '../../data-generators/index.js';
import { ERRORS } from '../../../errors/index.js';
import { POST_MAX_LIMIT } from '../../../constants/index.js';

describe('GET /posts/categories/top-this-week', () => {
  it(`Should return status 422 and an expected message for limit greater than ${POST_MAX_LIMIT}`, async () => {
    const response = await request(global.app).get(
      `/api/posts/categories/top-this-week?limit=${POST_MAX_LIMIT + 1}`,
    );

    expect(response.body.error.message).toBe(ERRORS.POST_LIMIT_PARAM_EXCEEDED);
    expect(response.status).toBe(422);
  });

  it('Should return empty list of posts if there are no posts', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .get('/api/posts/categories/top-this-week')
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      posts: [],
      total: 0,
      pages: 0,
      hasNextPage: false,
    });
  });

  it('Should return empty list of posts if are posts but not from this week', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    await Post.create(
      generateRandomPost({
        createdAt: subMilliseconds(startOfWeek(Date.now()), 1).toISOString(),
      }),
    );

    const response = await request(global.app)
      .get('/api/posts/categories/top-this-week')
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      posts: [],
      total: 0,
      pages: 0,
      hasNextPage: false,
    });
  });

  it('Should return list of posts with the expected structure if there are posts that fit the criteria', async () => {
    const otherUser = await User.create(generateRandomUser());

    const post = await Post.create(
      generateRandomPost({
        author: otherUser._id,
      }),
    );

    const response = await request(global.app).get(
      '/api/posts/categories/top-this-week',
    );

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
          sections: post.sections.toObject(),
          commentCount: 0,
          rating: post.rating,
          tags: post.tags.toObject(),
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

    await Post.insertMany(posts);

    const response = await request(global.app).get(
      '/api/posts/categories/top-this-week?limit=10',
    );

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

    await Post.insertMany(posts);

    const response = await request(global.app).get(
      '/api/posts/categories/top-this-week?limit=10&offset=10',
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

    const otherUser = await User.create(generateRandomUser());

    const post1 = await Post.create(
      generateRandomPost({
        author: otherUser._id,
      }),
    );

    const post2 = await Post.create(
      generateRandomPost({
        author: otherUser._id,
      }),
    );

    const rate1 = await Rate.create(
      generateRate({
        target: post1._id,
        negative: true,
        targetModel: 'Post',
      }),
    );

    const rate2 = await Rate.create(
      generateRate({
        target: post2._id,
        negative: false,
        targetModel: 'Post',
      }),
    );

    await User.findByIdAndUpdate(currentUser.id, {
      $push: { rates: { $each: [rate1._id, rate2._id] } },
    });

    const response = await request(global.app)
      .get('/api/posts/categories/top-this-week')
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    // Sorted by createdAt descending
    expect(response.body.posts[0]).toMatchObject({
      rated: {
        isRated: true,
        negative: false,
      },
    });
    expect(response.body.posts[1]).toMatchObject({
      rated: {
        isRated: true,
        negative: true,
      },
    });
  });

  it('Should sort posts by createdAt descending', async () => {
    const dates = [
      subSeconds(new Date(), 2).toISOString(),
      subSeconds(new Date(), 1).toISOString(),
      new Date().toISOString(),
    ];

    await Promise.all([
      Post.create(
        generateRandomPost({
          createdAt: dates[2],
        }),
      ),
      Post.create(
        generateRandomPost({
          createdAt: dates[1],
        }),
      ),
      Post.create(
        generateRandomPost({
          createdAt: dates[0],
        }),
      ),
    ]);

    const response = await request(global.app).get(
      '/api/posts/categories/top-this-week',
    );

    expect(response.status).toBe(200);
    expect(response.body.posts[0].createdAt).toBe(dates[2]);
    expect(response.body.posts[1].createdAt).toBe(dates[1]);
    expect(response.body.posts[2].createdAt).toBe(dates[0]);
  });
});
