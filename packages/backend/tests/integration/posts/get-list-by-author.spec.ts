import request from 'supertest';
import { PostModel } from '../../../src/models/Post';
import { UserModel } from '../../../src/models/User';
import {
  generateRandomPost,
  generateRandomUser,
} from '../../data-generators/index';
import { ERRORS } from '../../../src/errors';
import { POST_MAX_LIMIT } from '../../../src/constants';

describe('GET /posts?author=', () => {
  it(`Should return status 422 and an expected error message for limit > ${POST_MAX_LIMIT}`, async () => {
    const response = await request(global.app).get(
      `/api/posts?author=some-author&limit=${POST_MAX_LIMIT + 1}`,
    );

    expect(response.body.error.message).toBe(ERRORS.POST_LIMIT_PARAM_EXCEEDED);
    expect(response.status).toBe(422);
  });

  it("Should return status 404 and an expected error message if author doesn't exist", async () => {
    const response = await request(global.app).get(
      '/api/posts?author=not-existing-author',
    );

    expect(response.body.error.message).toBe(ERRORS.AUTHOR_NOT_FOUND);
    expect(response.status).toBe(404);
  });

  it("Should return empty list of posts if author doesn't have any posts", async () => {
    const otherUser = await UserModel.create(generateRandomUser());

    const response = await request(global.app).get(
      `/api/posts?author=${otherUser.login}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      posts: [],
      total: 0,
      pages: 0,
      hasNextPage: false,
    });
  });

  it("Should a list of the author's posts with an expected structure", async () => {
    const otherUser = await UserModel.create(generateRandomUser());

    const post = (
      await PostModel.create(
        generateRandomPost({
          author: otherUser._id,
        }),
      )
    ).toJSON();

    const response = await request(global.app).get(
      `/api/posts?author=${otherUser.login}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
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
          commentCount: 0,
          rating: 0,
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
});
