import request from 'supertest';
import { signUpRequest } from '../../utils/request-auth.js';
import Post from '../../../models/Post.js';
import User from '../../../models/User.js';
import {
  generateRandomPost,
  generateRandomUser,
} from '../../data-generators/index.js';
import { ERRORS } from '../../../errors/index.js';

describe('GET /posts/feed', () => {
  it('Should return status 401 and an expected message if user is not signed in', async () => {
    const response = await request(global.app).get('/api/posts/feed');

    expect(response.body.error.message).toBe(ERRORS.UNAUTHORIZED);
    expect(response.status).toBe(401);
  });

  it('Should return status 422 and an expected message for limit greater than 15', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .get('/api/posts/feed?limit=16')
      .set('Cookie', sessionCookie);

    expect(response.body.error.message).toBe(ERRORS.POST_LIMIT_PARAM_EXCEEDED);
    expect(response.status).toBe(422);
  });

  it('Should return status 401 and an expected message if session was provided but user for some reason is not found', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    await User.deleteOne({ _id: currentUser.id });

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
    await Post.create(generateRandomPost());

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

    const post = await Post.create(generateRandomPost());

    await User.findByIdAndUpdate(currentUser.id, {
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

    const otherUser = await User.create(generateRandomUser());

    const post = await Post.create(
      generateRandomPost({
        author: otherUser._id,
      }),
    );

    await User.findByIdAndUpdate(currentUser.id, {
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

    const post = await Post.create(
      generateRandomPost({
        author: currentUser.id,
      }),
    );

    await User.findByIdAndUpdate(currentUser.id, {
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

    const otherUser = await User.create(generateRandomUser());

    const post = (
      await Post.create(
        generateRandomPost({
          author: otherUser._id,
        }),
      )
    ).toJSON();

    await User.findByIdAndUpdate(currentUser.id, {
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
      commentCount: 0,
      rating: 0,
      tags: post.tags,
      rated: { isRated: false, negative: false },
      createdAt: post.createdAt.toISOString(),
    });
  });

  it('Should return more than one page in pagination if there are more than limit posts existing', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const otherUser = await User.create(generateRandomUser());

    const posts = Array(11)
      .fill({})
      .map((_, index) =>
        generateRandomPost({
          slug: `slug${index}`,
          author: otherUser._id,
        }),
      );

    await Post.insertMany(posts);

    await User.findByIdAndUpdate(currentUser.id, {
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
