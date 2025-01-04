import request from 'supertest';
import Rate from '../../../models/Rate.js';

import Post from '../../../models/Post.js';
import User from '../../../models/User.js';
import {
  generateRandomPost,
  generateRandomUser,
  generateRate,
} from '../../data-generators/index.js';
import { signUpRequest } from '../../utils/request-auth.js';
import { ERRORS } from '../../../errors/index.js';
import { POST_RATE_VALUE } from '../../../constants/index.js';

describe('PUT /posts/:id/vote', () => {
  it('Should return status 401 and an expected message if user is not signed in', async () => {
    const response = await request(global.app).put('/api/posts/1234/vote');

    expect(response.body.error.message).toBe(ERRORS.UNAUTHORIZED);
    expect(response.status).toBe(401);
  });

  it('Should return status 404 and a message for non-existing slug', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .put('/api/posts/5d5467b4c17806706f3df347/vote')
      .set('Cookie', sessionCookie);

    expect(response.body.error.message).toBe(ERRORS.POST_NOT_FOUND);
    expect(response.status).toBe(404);
  });

  it('Should return status 403 and an expected message when user tries to vote for their own post', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const post = await Post.create(
      generateRandomPost({
        author: currentUser.id,
      }),
    );

    const response = await request(global.app)
      .put(`/api/posts/${post._id}/vote`)
      .send({ negative: false })
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(403);
    expect(response.body.error.message).toBe(ERRORS.POST_CANT_RATE_OWN);
  });

  it('Should return status 403 and an expected message when user tries to vote for a post that they have already rated', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const otherUser = await User.create(generateRandomUser());

    const otherUserPost = await Post.create(
      generateRandomPost({
        author: otherUser._id,
      }),
    );

    const rate = await Rate.create(
      generateRate({
        target: otherUserPost._id,
        negative: true,
        targetModel: 'Post',
      }),
    );

    await User.findByIdAndUpdate(currentUser.id, {
      $push: { rates: rate._id },
    });

    const response = await request(global.app)
      .put(`/api/posts/${otherUserPost._id}/vote`)
      .send({ negative: false })
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(403);
    expect(response.body.error.message).toBe(
      ERRORS.POST_CANT_RATE_ALREADY_RATED,
    );
  });

  it('Should create a new post rate in the database', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const otherUser = await User.create(generateRandomUser());

    const post = await Post.create(
      generateRandomPost({
        author: otherUser._id,
      }),
    );

    const response = await request(global.app)
      .put(`/api/posts/${post._id}/vote`)
      .send({ negative: true })
      .set('Cookie', sessionCookie);

    const rate = await Rate.findOne({ target: post._id });

    expect(response.status).toBe(200);
    expect(rate).toBeDefined();
    expect(rate.target.toString()).toBe(post._id.toString());
    expect(rate.targetModel).toBe('Post');
    expect(rate.negative).toBe(true);
  });

  it.each([
    ['increase', false],
    ['decrease', true],
  ])(
    'Should %s the post rating after the post is rated',
    async (_, isNegative) => {
      const { sessionCookie } = await signUpRequest(global.app);

      const otherUser = await User.create(generateRandomUser());

      const post = await Post.create(
        generateRandomPost({
          author: otherUser._id,
        }),
      );

      await request(global.app)
        .put(`/api/posts/${post._id}/vote`)
        .send({ negative: isNegative })
        .set('Cookie', sessionCookie);

      const { rating } = await Post.findById(post._id);

      expect(rating).toBe(isNegative ? -POST_RATE_VALUE : POST_RATE_VALUE);
    },
  );

  it.each([
    ['increase', false],
    ['decrease', true],
  ])(
    "Should %s author's rating after after the post is rated",
    async (_, isNegative) => {
      const { sessionCookie } = await signUpRequest(global.app);

      const otherUser = await User.create(generateRandomUser());

      const post = await Post.create(
        generateRandomPost({
          author: otherUser._id,
        }),
      );

      await request(global.app)
        .put(`/api/posts/${post._id}/vote`)
        .send({ negative: isNegative })
        .set('Cookie', sessionCookie);

      const { rating } = await User.findById(otherUser._id);

      expect(rating).toBe(isNegative ? -POST_RATE_VALUE : POST_RATE_VALUE);
    },
  );

  it('Should return the updated post with changed rating after vote', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const otherUser = await User.create(generateRandomUser());

    const post = await Post.create(
      generateRandomPost({
        author: otherUser._id,
      }),
    );

    const response = await request(global.app)
      .put(`/api/posts/${post._id}/vote`)
      .send({ negative: true })
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body.rating).toBe(-POST_RATE_VALUE);
  });
});
