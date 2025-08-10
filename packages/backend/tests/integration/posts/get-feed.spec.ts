import request from 'supertest';
import { signUpRequest } from '@test-utils/request-auth';
import { PostModel } from '@models/Post';
import { UserModel } from '@models/User';
import { generateRandomPost, generateRandomUser } from '@test-data-generators';
import { ERRORS } from '@errors';
import { POST_MAX_LIMIT } from '@constants/index';

describe('GET /posts/feed', () => {
  it('Should return status 401 and an expected message if user is not signed in', async () => {
    const response = await request(global.app).get('/api/posts/feed');

    expect(response.body.error.message).toBe(ERRORS.UNAUTHORIZED);
    expect(response.status).toBe(401);
  });

  it(`Should return status 422 and an expected message for limit greater than ${POST_MAX_LIMIT}`, async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .get(`/api/posts/feed?limit=${POST_MAX_LIMIT + 1}`)
      .set('Cookie', sessionCookie);

    expect(response.body.error.message).toBe(ERRORS.POST_LIMIT_PARAM_EXCEEDED);
    expect(response.status).toBe(422);
  });

  it('Should return status 401 and an expected message if session was provided but user for some reason is not found', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    await UserModel.deleteOne({ _id: currentUser.id });

    const response = await request(global.app)
      .get('/api/posts/feed')
      .set('Cookie', sessionCookie);

    expect(response.body.error.message).toBe(ERRORS.UNAUTHORIZED);
    expect(response.status).toBe(401);
  });

  it('Should an empty list of posts (no subscriptions)', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    /* Creating a post just to make sure response.posts
    is empty not because there are no posts at all */
    await PostModel.create(generateRandomPost());

    const response = await request(global.app)
      .get('/api/posts/feed')
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      posts: [],
      total: 0,
      pages: 0,
      hasNextPage: false,
    });
  });

  it('Should a list of posts if user is subscribed to any of the post tags', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const post = await PostModel.create(generateRandomPost());

    await UserModel.findByIdAndUpdate(currentUser.id, {
      $push: { tagsFollowed: post.tags[0] },
    });

    const response = await request(global.app)
      .get('/api/posts/feed')
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body.posts).toHaveLength(1);
    expect(response.body).toMatchObject({
      total: 1,
      pages: 1,
      hasNextPage: false,
    });
  });

  it('Should return a list of posts if user is subscribed to the post author', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const otherUser = await UserModel.create(generateRandomUser());

    const post = await PostModel.create(
      generateRandomPost({
        author: otherUser._id,
      }),
    );

    await UserModel.findByIdAndUpdate(currentUser.id, {
      $push: { usersFollowed: post.author },
    });

    const response = await request(global.app)
      .get('/api/posts/feed')
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body.posts).toHaveLength(1);
    expect(response.body).toMatchObject({
      total: 1,
      pages: 1,
      hasNextPage: false,
    });
  });

  it('Should not return a post if user is subscribed to any of the post tags but also is the author of the post (users should not see their own posts in their feed)', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const post = await PostModel.create(
      generateRandomPost({
        author: currentUser.id,
      }),
    );

    await UserModel.findByIdAndUpdate(currentUser.id, {
      $push: { tagsFollowed: post.tags[0] },
    });

    const response = await request(global.app)
      .get('/api/posts/feed')
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body.posts).toHaveLength(0);
    expect(response.body).toMatchObject({
      total: 0,
      pages: 0,
      hasNextPage: false,
    });
  });

  it('Should return a post in the response with an expected structure', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const otherUser = await UserModel.create(generateRandomUser());

    const post = (
      await PostModel.create(
        generateRandomPost({
          author: otherUser._id,
        }),
      )
    ).toJSON();

    await UserModel.findByIdAndUpdate(currentUser.id, {
      $push: { tagsFollowed: post.tags[0] },
    });

    const response = await request(global.app)
      .get('/api/posts/feed')
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body.posts[0]).toEqual({
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
      rated: { isRated: false },
      createdAt: post.createdAt.toISOString(),
    });
  });

  it('Should return more than one page in pagination if there are more than limit posts existing', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const otherUser = await UserModel.create(generateRandomUser());

    const posts = Array(11)
      .fill({})
      .map((_, index) =>
        generateRandomPost({
          slug: `slug${index}`,
          author: otherUser._id,
        }),
      );

    await PostModel.insertMany(posts);

    await UserModel.findByIdAndUpdate(currentUser.id, {
      $push: { tagsFollowed: posts[0].tags[0] },
    });

    const response = await request(global.app)
      .get('/api/posts/feed?limit=10')
      .set('Cookie', sessionCookie);

    const responseWithOffset = await request(global.app)
      .get('/api/posts/feed?limit=10&offset=10')
      .set('Cookie', sessionCookie);

    // Request with only limit
    expect(response.status).toBe(200);
    expect(response.body.posts).toHaveLength(10);
    expect(response.body).toMatchObject({
      total: 11,
      pages: 2,
      hasNextPage: true,
    });
    // Request with offset
    expect(responseWithOffset.status).toBe(200);
    expect(responseWithOffset.body.posts).toHaveLength(1);
    expect(responseWithOffset.body).toMatchObject({
      total: 11,
      pages: 2,
      hasNextPage: false,
    });
  });
});
