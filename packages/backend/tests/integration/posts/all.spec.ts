import request from 'supertest';
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

describe('GET /posts/categories/all', () => {
  it(`Should return status 422 and an expected message for limit greater than ${POST_MAX_LIMIT}`, async () => {
    const response = await request(global.app).get(
      `/api/posts/categories/all?limit=${POST_MAX_LIMIT + 1}`,
    );

    expect(response.body.error.message).toBe(ERRORS.POST_LIMIT_PARAM_EXCEEDED);
    expect(response.status).toBe(422);
  });

  it('Should return empty list of posts if there are no posts', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .get('/api/posts/categories/all')
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

    const response = await request(global.app).get('/api/posts/categories/all');

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
      '/api/posts/categories/all?limit=10',
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
      '/api/posts/categories/all?limit=10&offset=10',
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
      .get('/api/posts/categories/all')
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

    const response = await request(global.app).get('/api/posts/categories/all');

    expect(response.status).toBe(200);
    expect(response.body.posts[0].rating).toBe(15);
    expect(response.body.posts[1].rating).toBe(10);
    expect(response.body.posts[2].rating).toBe(5);
  });
});
