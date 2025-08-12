import request from 'supertest';
import { RateModel, RateTargetModel } from '@models/Rate';
import { CommentModel } from '@models/Comment';
import { UserModel } from '@models/User';
import {
  generateRandomComment,
  generateRandomUser,
  generateRate,
} from '@test-data-generators';
import { signUpRequest } from '@test-utils/request-auth';
import { ERRORS } from '@errors';
import { COMMENT_RATE_VALUE } from '@constants/index';

describe('DELETE /comments/:id/vote', () => {
  it('Should return status 401 and an expected message if user is not signed in', async () => {
    const response = await request(global.app).delete(
      '/api/comments/1234/vote',
    );

    expect(response.body.error.message).toBe(ERRORS.UNAUTHORIZED);
    expect(response.status).toBe(401);
  });

  it('Should return status 404 and a message for a non-existing comment', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .delete('/api/comments/5f8d9f4d2d4c2c001d0e1e2e/vote')
      .set('Cookie', sessionCookie);

    expect(response.body.error.message).toBe(ERRORS.COMMENT_NOT_FOUND);
    expect(response.status).toBe(404);
  });

  it('Should return status 403 and an expected message when user tries to unvote a comment that has not been rated', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const comment = await CommentModel.create(
      generateRandomComment({
        author: currentUser.id,
      }),
    );

    const response = await request(global.app)
      .delete(`/api/comments/${comment._id}/vote`)
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(403);
    expect(response.body.error.message).toBe(ERRORS.TARGET_IS_NOT_RATED);
  });

  it('Should delete a comment rate from the database', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const otherUser = await UserModel.create(generateRandomUser());

    const otherUserComment = await CommentModel.create(
      generateRandomComment({
        author: otherUser.id,
      }),
    );

    const prevRate = await RateModel.create(
      generateRate({
        target: otherUserComment._id,
        negative: true,
        targetModel: RateTargetModel.COMMENT,
      }),
    );

    await UserModel.findByIdAndUpdate(currentUser.id, {
      $push: { rates: prevRate._id },
    });

    await request(global.app)
      .delete(`/api/comments/${otherUserComment._id}/vote`)
      .set('Cookie', sessionCookie);

    const rate = await RateModel.findOne({ target: otherUserComment._id });

    expect(rate).toBe(null);
  });

  it.each([
    ['increase', true],
    ['decrease', false],
  ])(
    'Should %s the comment rating after the comment is unrated after being voted for',
    async (_, isNegative) => {
      const { sessionCookie, currentUser } = await signUpRequest(global.app);

      const otherUser = await UserModel.create(generateRandomUser());

      const otherUserComment = await CommentModel.create(
        generateRandomComment({
          author: otherUser._id,
          rating: 1,
        }),
      );

      const prevRate = await RateModel.create(
        generateRate({
          target: otherUserComment._id,
          negative: isNegative,
          targetModel: RateTargetModel.COMMENT,
        }),
      );

      await UserModel.findByIdAndUpdate(currentUser.id, {
        $push: { rates: prevRate._id },
      });

      await request(global.app)
        .delete(`/api/comments/${otherUserComment._id}/vote`)
        .set('Cookie', sessionCookie);

      const commentVotedFor = await CommentModel.findById(otherUserComment._id);

      // the effect a vote had on the rating is reset
      expect(commentVotedFor!.rating).toBe(
        isNegative
          ? otherUserComment.rating + COMMENT_RATE_VALUE
          : otherUserComment.rating - COMMENT_RATE_VALUE,
      );
    },
  );

  it.each([
    ['increase', true],
    ['decrease', false],
  ])(
    "Should %s author's rating after the comment is unrated",
    async (_, isNegative) => {
      const { sessionCookie, currentUser } = await signUpRequest(global.app);

      const otherUser = await UserModel.create(
        generateRandomUser({
          rating: 1,
        }),
      );

      const otherUserComment = await CommentModel.create(
        generateRandomComment({
          author: otherUser._id,
        }),
      );

      const prevRate = await RateModel.create(
        generateRate({
          target: otherUserComment._id,
          negative: isNegative,
          targetModel: RateTargetModel.COMMENT,
        }),
      );

      await UserModel.findByIdAndUpdate(currentUser.id, {
        $push: { rates: prevRate._id },
      });

      await request(global.app)
        .delete(`/api/comments/${otherUserComment._id}/vote`)
        .set('Cookie', sessionCookie);

      const commentVotedFor = await UserModel.findById(otherUser._id);

      expect(commentVotedFor!.rating).toBe(
        isNegative
          ? otherUser.rating + COMMENT_RATE_VALUE
          : otherUser.rating - COMMENT_RATE_VALUE,
      );
    },
  );

  it('Should return the updated comment with changed rating after vote', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const otherUser = await UserModel.create(generateRandomUser());

    const otherUserComment = await CommentModel.create(
      generateRandomComment({
        author: otherUser._id,
      }),
    );

    const prevRate = await RateModel.create(
      generateRate({
        target: otherUserComment._id,
        negative: false,
        targetModel: RateTargetModel.COMMENT,
      }),
    );

    await UserModel.findByIdAndUpdate(currentUser.id, {
      $push: { rates: prevRate._id },
    });

    const response = await request(global.app)
      .delete(`/api/comments/${otherUserComment._id}/vote`)
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body.rating).toBe(
      otherUserComment.rating + -COMMENT_RATE_VALUE,
    );
  });
});
