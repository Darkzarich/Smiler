import request from 'supertest';
import { RateModel, RateTargetModel } from '@models/Rate';

import { PostModel } from '@models/Post';
import { UserModel } from '@models/User';
import {
  generateRandomPost,
  generateRandomUser,
  generateRate,
} from '@test-data-generators';
import { signUpRequest } from '@test-utils/request-auth';
import { ERRORS } from '@errors';
import { POST_RATE_VALUE } from '@constants/index';

describe('DELETE /posts/:id/vote', () => {
  it('Should return status 401 and an expected message if user is not signed in', async () => {
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

    const post = await PostModel.create(
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

    const otherUser = await UserModel.create(generateRandomUser());

    const post = await PostModel.create(
      generateRandomPost({
        author: otherUser._id,
      }),
    );

    const prevRate = await RateModel.create(
      generateRate({
        target: post._id,
        negative: true,
        targetModel: RateTargetModel.POST,
      }),
    );

    await UserModel.findByIdAndUpdate(currentUser.id, {
      $push: { rates: prevRate._id },
    });

    await request(global.app)
      .delete(`/api/posts/${post._id}/vote`)
      .set('Cookie', sessionCookie);

    const rate = await RateModel.findOne({ target: post._id });

    expect(rate).toBe(null);
  });

  it.each([
    ['increase', true],
    ['decrease', false],
  ])(
    'Should %s the post rating after the post is unrated after being voted for',
    async (_, isNegative) => {
      const { sessionCookie, currentUser } = await signUpRequest(global.app);

      const otherUser = await UserModel.create(generateRandomUser());

      const post = await PostModel.create(
        generateRandomPost({
          author: otherUser._id,
          rating: 1,
        }),
      );

      const prevRate = await RateModel.create(
        generateRate({
          target: post._id,
          negative: isNegative,
          targetModel: RateTargetModel.POST,
        }),
      );

      await UserModel.findByIdAndUpdate(currentUser.id, {
        $push: { rates: prevRate._id },
      });

      await request(global.app)
        .delete(`/api/posts/${post._id}/vote`)
        .set('Cookie', sessionCookie);

      const unvotedPost = await PostModel.findById(post._id);

      // the effect a vote had on the rating is reset
      expect(unvotedPost!.rating).toBe(
        isNegative
          ? post!.rating! + POST_RATE_VALUE
          : post!.rating! - POST_RATE_VALUE,
      );
    },
  );

  it.each([
    ['increase', true],
    ['decrease', false],
  ])(
    "Should %s author's rating after after the post is unrated",
    async (_, isNegative) => {
      const { sessionCookie, currentUser } = await signUpRequest(global.app);

      const otherUser = await UserModel.create(
        generateRandomUser({
          rating: 1,
        }),
      );

      const post = await PostModel.create(
        generateRandomPost({
          author: otherUser._id,
        }),
      );

      const prevRate = await RateModel.create(
        generateRate({
          target: post._id,
          negative: isNegative,
          targetModel: RateTargetModel.POST,
        }),
      );

      await UserModel.findByIdAndUpdate(currentUser.id, {
        $push: { rates: prevRate._id },
      });

      await request(global.app)
        .delete(`/api/posts/${post._id}/vote`)
        .set('Cookie', sessionCookie);

      const unvotedPost = await UserModel.findById(otherUser._id);

      expect(unvotedPost!.rating).toBe(
        isNegative
          ? otherUser.rating + POST_RATE_VALUE
          : otherUser.rating - POST_RATE_VALUE,
      );
    },
  );

  it('Should return the updated post with changed rating after vote', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const otherUser = await UserModel.create(generateRandomUser());

    const post = await PostModel.create(
      generateRandomPost({
        author: otherUser._id,
      }),
    );

    const prevRate = await RateModel.create(
      generateRate({
        target: post._id,
        negative: false,
        targetModel: RateTargetModel.POST,
      }),
    );

    await UserModel.findByIdAndUpdate(currentUser.id, {
      $push: { rates: prevRate._id },
    });

    const response = await request(global.app)
      .delete(`/api/posts/${post._id}/vote`)
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body.rating).toBe(-POST_RATE_VALUE);
  });
});
