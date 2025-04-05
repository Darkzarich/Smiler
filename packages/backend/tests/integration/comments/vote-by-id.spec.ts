import request from 'supertest';
import { RateModel } from '../../../src/models/Rate';
import { CommentModel } from '../../../src/models/Comment';
import { UserModel } from '../../../src/models/User';
import {
  generateRandomComment,
  generateRandomUser,
  generateRate,
} from '../../data-generators/index';
import { signUpRequest } from '../../utils/request-auth';
import { ERRORS } from '../../../src/errors';
import { COMMENT_RATE_VALUE } from '../../../src/constants';

describe('PUT /comments/:id/vote', () => {
  it('Should return status 401 and an expected message if user is not signed in', async () => {
    const response = await request(global.app).put('/api/comments/1234/vote');

    expect(response.body.error.message).toBe(ERRORS.UNAUTHORIZED);
    expect(response.status).toBe(401);
  });

  it('Should return status 404 and a message for a non-existing comment', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .put('/api/comments/5f8d9f4d2d4c2c001d0e1e2e/vote')
      .set('Cookie', sessionCookie);

    expect(response.body.error.message).toBe(ERRORS.COMMENT_NOT_FOUND);
    expect(response.status).toBe(404);
  });

  it('Should return status 403 and an expected message when user tries to vote for their own comment', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const comment = await CommentModel.create(
      generateRandomComment({
        author: currentUser.id,
      }),
    );

    const response = await request(global.app)
      .put(`/api/comments/${comment._id}/vote`)
      .send({ negative: false })
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(403);
    expect(response.body.error.message).toBe(ERRORS.COMMENT_CANT_RATE_OWN);
  });

  it('Should return status 403 and an expected message when user tries to vote for a comment that they have already rated', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const otherUser = await UserModel.create(generateRandomUser());

    const otherUserComment = await CommentModel.create(
      generateRandomComment({
        author: otherUser.id,
      }),
    );

    const rate = await RateModel.create(
      generateRate({
        target: otherUserComment._id,
        negative: true,
        targetModel: 'Comment',
      }),
    );

    await UserModel.findByIdAndUpdate(currentUser.id, {
      $push: { rates: rate._id },
    });

    const response = await request(global.app)
      .put(`/api/comments/${otherUserComment._id}/vote`)
      .send({ negative: false })
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(403);
    expect(response.body.error.message).toBe(
      ERRORS.COMMENT_CANT_RATE_ALREADY_RATED,
    );
  });

  it('Should create a new comment rate in the database', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const otherUser = await UserModel.create(generateRandomUser());

    const otherUserComment = await CommentModel.create(
      generateRandomComment({
        author: otherUser.id,
      }),
    );

    const response = await request(global.app)
      .put(`/api/comments/${otherUserComment._id}/vote`)
      .send({ negative: true })
      .set('Cookie', sessionCookie);

    const rate = await RateModel.findOne({ target: otherUserComment._id });

    expect(response.status).toBe(200);
    expect(rate!.target.toString()).toBe(otherUserComment._id.toString());
    expect(rate!.targetModel).toBe('Comment');
    expect(rate!.negative).toBe(true);
  });

  it.each([
    ['increase', false],
    ['decrease', true],
  ])(
    'Should %s the comment rating after the comment is rated',
    async (_, isNegative) => {
      const { sessionCookie } = await signUpRequest(global.app);

      const otherUser = await UserModel.create(generateRandomUser());

      const otherUserComment = await CommentModel.create(
        generateRandomComment({
          author: otherUser.id,
        }),
      );

      await request(global.app)
        .put(`/api/comments/${otherUserComment._id}/vote`)
        .send({ negative: isNegative })
        .set('Cookie', sessionCookie);

      const commentVotedFor = await CommentModel.findById(otherUserComment._id);

      expect(commentVotedFor!.rating).toBe(
        isNegative ? -COMMENT_RATE_VALUE : COMMENT_RATE_VALUE,
      );
    },
  );

  it.each([
    ['increase', false],
    ['decrease', true],
  ])(
    "Should %s author's rating after after the comment is rated",
    async (_, isNegative) => {
      const { sessionCookie } = await signUpRequest(global.app);

      const otherUser = await UserModel.create(generateRandomUser());

      const otherUserComment = await CommentModel.create(
        generateRandomComment({
          author: otherUser.id,
        }),
      );

      await request(global.app)
        .put(`/api/comments/${otherUserComment._id}/vote`)
        .send({ negative: isNegative })
        .set('Cookie', sessionCookie);

      const commentVotedFor = await UserModel.findById(otherUser._id);

      expect(commentVotedFor!.rating).toBe(
        isNegative ? -COMMENT_RATE_VALUE : COMMENT_RATE_VALUE,
      );
    },
  );

  it('Should return the updated comment with changed rating after vote', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const otherUser = await UserModel.create(generateRandomUser());

    const otherUserComment = await CommentModel.create(
      generateRandomComment({
        author: otherUser.id,
      }),
    );

    const response = await request(global.app)
      .put(`/api/comments/${otherUserComment._id}/vote`)
      .send({ negative: true })
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body.rating).toBe(-COMMENT_RATE_VALUE);
  });
});
