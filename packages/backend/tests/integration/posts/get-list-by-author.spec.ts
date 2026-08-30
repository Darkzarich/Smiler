import request from 'supertest';
import { subSeconds } from 'date-fns';
import { PostModel } from '@models/Post';
import { UserModel } from '@models/User';
import { generateRandomPost, generateRandomUser } from '@test-data-generators';
import { ERRORS } from '@errors';
import { POST_MAX_LIMIT } from '@constants/index';

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
    });
  });

  it("Should page the author's posts by cursor", async () => {
    const otherUser = await UserModel.create(generateRandomUser());

    const posts = await PostModel.insertMany(
      Array(3)
        .fill({})
        .map((_, index) =>
          generateRandomPost({
            author: otherUser._id,
            createdAt: subSeconds(new Date(), index),
          }),
        ),
    );

    const firstPage = await request(global.app).get(
      `/api/posts?author=${otherUser.login}&limit=2`,
    );

    expect(firstPage.status).toBe(200);
    expect(
      firstPage.body.posts.map((post: { _id: string }) => post._id),
    ).toEqual([posts[0]._id.toString(), posts[1]._id.toString()]);
    expect(firstPage.body.hasNextPage).toBe(true);

    const secondPage = await request(global.app).get(
      `/api/posts?author=${otherUser.login}&limit=2&cursor=${firstPage.body.nextCursor}`,
    );

    expect(secondPage.status).toBe(200);
    expect(
      secondPage.body.posts.map((post: { _id: string }) => post._id),
    ).toEqual([posts[2]._id.toString()]);
    expect(secondPage.body).toMatchObject({
      hasNextPage: false,
      nextCursor: null,
    });
  });
});
