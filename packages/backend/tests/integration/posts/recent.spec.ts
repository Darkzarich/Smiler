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
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .get(`/api/posts/categories/recent?limit=${POST_MAX_LIMIT + 1}`)
      .set('Cookie', sessionCookie);

    expect(response.body.error.message).toBe(ERRORS.POST_LIMIT_PARAM_EXCEEDED);
    expect(response.status).toBe(422);
  });

  it('Should return empty list of posts if there are no posts', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .get('/api/posts/categories/recent')
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      posts: [],
      total: 0,
      pages: 0,
      hasNextPage: false,
    });
  });

  it('Should return empty list of posts if are posts but posted not today', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    await PostModel.create(
      generateRandomPost({
        createdAt: subDays(new Date(), 2),
      }),
    );

    const response = await request(global.app)
      .get('/api/posts/categories/recent')
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

    const response = await request(global.app).get(
      '/api/posts/categories/recent?limit=10',
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

    await PostModel.insertMany(posts);

    const response = await request(global.app).get(
      '/api/posts/categories/recent?limit=10&offset=10',
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
      .get('/api/posts/categories/recent')
      .set('Cookie', sessionCookie);

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
});
