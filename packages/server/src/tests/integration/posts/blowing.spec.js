import request from 'supertest';
import { subHours } from 'date-fns';
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
import {
  POST_BLOWING_RATING_THRESHOLD,
  POST_MAX_LIMIT,
} from '../../../constants/index.js';

describe('GET /posts/categories/blowing', () => {
  it(`Should return status 422 and an expected message for limit greater than ${POST_MAX_LIMIT}`, async () => {
    const response = await request(global.app).get(
      `/api/posts/categories/blowing?limit=${POST_MAX_LIMIT + 1}`,
    );

    expect(response.body.error.message).toBe(ERRORS.POST_LIMIT_PARAM_EXCEEDED);
    expect(response.status).toBe(422);
  });

  it('Should return empty list of posts if there are no posts', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .get('/api/posts/categories/blowing')
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      posts: [],
      total: 0,
      pages: 0,
      hasNextPage: false,
    });
  });

  it('Should return empty list of posts if are posts but do not have enough rating', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    await Post.create(generateRandomPost());

    const response = await request(global.app)
      .get('/api/posts/categories/blowing')
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      posts: [],
      total: 0,
      pages: 0,
      hasNextPage: false,
    });
  });

  it('Should return empty list of posts if are posts but it was created more than an hour ago', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    await Post.create(
      generateRandomPost({
        createdAt: subHours(Date.now(), 2),
        rating: POST_BLOWING_RATING_THRESHOLD,
      }),
    );

    const response = await request(global.app)
      .get('/api/posts/categories/blowing')
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
        rating: POST_BLOWING_RATING_THRESHOLD,
      }),
    );

    const response = await request(global.app).get(
      '/api/posts/categories/blowing',
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
          rating: POST_BLOWING_RATING_THRESHOLD,
        }),
      );

    await Post.insertMany(posts);

    const response = await request(global.app).get(
      '/api/posts/categories/blowing?limit=10',
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
          rating: POST_BLOWING_RATING_THRESHOLD,
        }),
      );

    await Post.insertMany(posts);

    const response = await request(global.app).get(
      '/api/posts/categories/blowing?limit=10&offset=10',
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
        rating: POST_BLOWING_RATING_THRESHOLD,
      }),
    );

    const post2 = await Post.create(
      generateRandomPost({
        author: otherUser._id,
        rating: POST_BLOWING_RATING_THRESHOLD,
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
      .get('/api/posts/categories/blowing')
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body.posts[0]).toMatchObject({
      rated: {
        isRated: true,
        negative: true,
      },
    });
    expect(response.body.posts[1]).toMatchObject({
      rated: {
        isRated: true,
        negative: false,
      },
    });
  });

  it('Should sort posts by rating descending', async () => {
    await Promise.all([
      Post.create(
        generateRandomPost({
          rating: POST_BLOWING_RATING_THRESHOLD + 15,
        }),
      ),
      Post.create(
        generateRandomPost({
          rating: POST_BLOWING_RATING_THRESHOLD + 5,
        }),
      ),
      Post.create(
        generateRandomPost({
          rating: POST_BLOWING_RATING_THRESHOLD + 10,
        }),
      ),
    ]);

    const response = await request(global.app).get(
      '/api/posts/categories/blowing',
    );

    expect(response.status).toBe(200);
    expect(response.body.posts[0].rating).toBe(
      POST_BLOWING_RATING_THRESHOLD + 15,
    );
    expect(response.body.posts[1].rating).toBe(
      POST_BLOWING_RATING_THRESHOLD + 10,
    );
    expect(response.body.posts[2].rating).toBe(
      POST_BLOWING_RATING_THRESHOLD + 5,
    );
  });
});
