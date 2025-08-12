import request from 'supertest';
import { RateModel, RateTargetModel } from '@models/Rate';
import { CommentModel } from '@models/Comment';
import { UserDocument, UserModel } from '@models/User';
import {
  generateRandomComment,
  generateRandomUser,
  generateRate,
} from '@test-data-generators';
import { signUpRequest } from '@test-utils/request-auth';
import { ERRORS } from '@errors';
import { COMMENT_RATE_VALUE } from '@constants/index';

/**
 * Create voted comment state in the database:
 * - Create other than the current user
 * - Create a comment by the other user
 * - Makes that new comment voted by the current user
 * */
async function createVotedOtherUserComment(
  currentUser: UserDocument,
  isNegative: boolean,
) {
  const otherUser = await UserModel.create(generateRandomUser());

  const otherUserComment = await CommentModel.create(
    generateRandomComment({
      author: otherUser._id,
    }),
  );

  const rate = await RateModel.create(
    generateRate({
      target: otherUserComment._id,
      negative: isNegative,
      targetModel: RateTargetModel.COMMENT,
    }),
  );

  await UserModel.findByIdAndUpdate(currentUser.id, {
    $push: { rates: rate._id },
  });

  return {
    otherUserComment,
    otherUser,
    rate,
  };
}

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

  it.each([true, false])(
    'Should return status 403 and an expected message when user tries to vote for a comment in the same direction (negative: %s) which they have already voted',
    async (isNegative) => {
      const { sessionCookie, currentUser } = await signUpRequest(global.app);

      const { otherUserComment } = await createVotedOtherUserComment(
        currentUser,
        isNegative,
      );

      const response = await request(global.app)
        .put(`/api/comments/${otherUserComment._id}/vote`)
        .send({ negative: isNegative })
        .set('Cookie', sessionCookie);

      expect(response.status).toBe(403);
      expect(response.body.error.message).toBe(
        ERRORS.COMMENT_CANT_RATE_ALREADY_RATED,
      );
    },
  );

  describe('The post has not been rated by the current user yet', () => {
    it('Should create a new "Comment" rate in the database', async () => {
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
      expect(rate!.targetModel).toBe(RateTargetModel.COMMENT);
      expect(rate!.negative).toBe(true);
    });

    it.each([
      ['increase', false],
      ['decrease', true],
    ])(
      'Should %s the comment rating after the comment is rated (negative: %s)',
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

        const commentVotedFor = await CommentModel.findById(
          otherUserComment._id,
        );

        const rateValue = isNegative ? -COMMENT_RATE_VALUE : COMMENT_RATE_VALUE;

        expect(otherUserComment.rating).toBe(
          commentVotedFor!.rating - rateValue,
        );
      },
    );

    it.each([
      ['increase', false],
      ['decrease', true],
    ])(
      "Should %s author's rating after the comment is rated (negative: %s)",
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

        const updatedOtherUser = await UserModel.findById(otherUser._id);

        const rateValue = isNegative ? -COMMENT_RATE_VALUE : COMMENT_RATE_VALUE;

        expect(otherUser.rating).toBe(updatedOtherUser!.rating - rateValue);
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

  describe('The comment has been rated by the current user - voting in the opposite direction', () => {
    it.each([true, false])(
      'Should update the existing comment rate in the database (negative: %s)',
      async (isNegative) => {
        const { sessionCookie, currentUser } = await signUpRequest(global.app);

        const { otherUserComment } = await createVotedOtherUserComment(
          currentUser,
          !isNegative,
        );

        const response = await request(global.app)
          .put(`/api/comments/${otherUserComment._id}/vote`)
          .send({ negative: isNegative })
          .set('Cookie', sessionCookie);

        const updatedRate = await RateModel.findOne({
          target: otherUserComment._id,
        });

        expect(response.status).toBe(200);
        expect(updatedRate).toBeDefined();
        expect(updatedRate!.negative).toBe(isNegative);
      },
    );

    it.each([
      ['increase', false],
      ['decrease', true],
    ])(
      'Should twice %s the post rating after the post is rate is updated (negative: %s)',
      async (_, isNegative) => {
        const { sessionCookie, currentUser } = await signUpRequest(global.app);

        const { otherUserComment } = await createVotedOtherUserComment(
          currentUser,
          !isNegative,
        );

        await request(global.app)
          .put(`/api/comments/${otherUserComment._id}/vote`)
          .send({ negative: isNegative })
          .set('Cookie', sessionCookie);

        const ratedPost = await CommentModel.findById(otherUserComment._id);

        const rateValue = isNegative ? -COMMENT_RATE_VALUE : COMMENT_RATE_VALUE;

        expect(otherUserComment.rating).toBe(ratedPost!.rating - rateValue * 2);
      },
    );

    it.each([
      ['increase', false],
      ['decrease', true],
    ])(
      "Should twice %s author's rating after the post is rated",
      async (_, isNegative) => {
        const { sessionCookie, currentUser } = await signUpRequest(global.app);

        const { otherUserComment, otherUser } =
          await createVotedOtherUserComment(currentUser, !isNegative);

        await request(global.app)
          .put(`/api/comments/${otherUserComment._id}/vote`)
          .send({ negative: isNegative })
          .set('Cookie', sessionCookie);

        const updatedOtherUser = await UserModel.findById(otherUser._id);

        const rateValue = isNegative ? -COMMENT_RATE_VALUE : COMMENT_RATE_VALUE;

        expect(otherUser.rating).toBe(updatedOtherUser!.rating - rateValue * 2);
      },
    );

    it('Should return the updated post with changed rating after vote', async () => {
      const { sessionCookie, currentUser } = await signUpRequest(global.app);

      const isNegative = true;

      const { otherUserComment } = await createVotedOtherUserComment(
        currentUser,
        !isNegative,
      );

      const response = await request(global.app)
        .put(`/api/comments/${otherUserComment._id}/vote`)
        .send({ negative: isNegative })
        .set('Cookie', sessionCookie);

      expect(response.status).toBe(200);
      expect(response.body.rating).toBe(
        otherUserComment.rating + -COMMENT_RATE_VALUE * 2,
      );
    });
  });
});
