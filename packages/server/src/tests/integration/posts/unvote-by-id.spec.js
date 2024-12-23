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

describe('DELETE /posts/:id/vote', () => {
  it('Should return status 401 and an expected message for not signed in user', async () => {
    const response = await request(global.app).delete('/api/posts/1234/vote');

    expect(response.body.error.message).toBe(ERRORS.UNAUTHORIZED);
    expect(response.status).toBe(401);
  });

  it('Should return status 404 and a message for non-existing slug', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .delete('/api/posts/5d5467b4c17806706f3df347/vote')
      .set('Cookie', sessionCookie);

    expect(response.body.error.message).toBe(ERRORS.POST_NOT_FOUND);
    expect(response.status).toBe(404);
  });

  it('Should return status 403 and an expected message when user tries to unvote a post that has not been rated', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const post = await Post.create(
      generateRandomPost({
        author: currentUser.id,
      }),
    );

    const response = await request(global.app)
      .delete(`/api/posts/${post._id}/vote`)
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(403);
    expect(response.body.error.message).toBe(ERRORS.TARGET_IS_NOT_RATED);
  });

  it('Should delete a rate from the database', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const otherUser = await User.create(generateRandomUser());

    const post = await Post.create(
      generateRandomPost({
        author: otherUser._id,
      }),
    );

    const prevRate = await Rate.create(
      generateRate({
        target: post._id,
        negative: true,
        targetModel: 'Post',
      }),
    );

    await User.findByIdAndUpdate(currentUser.id, {
      $push: { rates: prevRate._id },
    });

    await request(global.app)
      .delete(`/api/posts/${post._id}/vote`)
      .set('Cookie', sessionCookie);

    const rate = await Rate.findOne({ target: post._id });

    expect(rate).toBe(null);
  });

  it.each([
    ['increase', true],
    ['decrease', false],
  ])(
    'Should %s the post rating after the post is unrated after being voted for',
    async (_, isNegative) => {
      const { sessionCookie, currentUser } = await signUpRequest(global.app);

      const otherUser = await User.create(generateRandomUser());

      const post = await Post.create(
        generateRandomPost({
          author: otherUser._id,
          rating: 1,
        }),
      );

      const prevRate = await Rate.create(
        generateRate({
          target: post._id,
          negative: isNegative,
          targetModel: 'Post',
        }),
      );

      await User.findByIdAndUpdate(currentUser.id, {
        $push: { rates: prevRate._id },
      });

      await request(global.app)
        .delete(`/api/posts/${post._id}/vote`)
        .set('Cookie', sessionCookie);

      const { rating } = await Post.findById(post._id);

      // the effect a vote had on the rating is reset
      expect(rating).toBe(isNegative ? post.rating + 1 : post.rating - 1);
    },
  );

  it.each([
    ['increase', true],
    ['decrease', false],
  ])(
    "Should %s author's rating after after the post is unrated",
    async (_, isNegative) => {
      const { sessionCookie, currentUser } = await signUpRequest(global.app);

      const otherUser = await User.create(
        generateRandomUser({
          rating: 1,
        }),
      );

      const post = await Post.create(
        generateRandomPost({
          author: otherUser._id,
        }),
      );

      const prevRate = await Rate.create(
        generateRate({
          target: post._id,
          negative: isNegative,
          targetModel: 'Post',
        }),
      );

      await User.findByIdAndUpdate(currentUser.id, {
        $push: { rates: prevRate._id },
      });

      await request(global.app)
        .delete(`/api/posts/${post._id}/vote`)
        .set('Cookie', sessionCookie);

      const { rating } = await User.findById(otherUser._id);

      expect(rating).toBe(
        isNegative ? otherUser.rating + 1 : otherUser.rating - 1,
      );
    },
  );

  it('Should return the updated post with changed rating after vote', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const otherUser = await User.create(generateRandomUser());

    const post = await Post.create(
      generateRandomPost({
        author: otherUser._id,
      }),
    );

    const prevRate = await Rate.create(
      generateRate({
        target: post._id,
        negative: false,
        targetModel: 'Post',
      }),
    );

    await User.findByIdAndUpdate(currentUser.id, {
      $push: { rates: prevRate._id },
    });

    const response = await request(global.app)
      .delete(`/api/posts/${post._id}/vote`)
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body.rating).toBe(-1);
  });
});
