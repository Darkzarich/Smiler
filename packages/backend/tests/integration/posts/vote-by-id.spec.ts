import request from 'supertest';
import { RateModel, RateTargetModel } from '@models/Rate';

import { PostModel } from '@models/Post';
import { UserDocument, UserModel } from '@models/User';
import {
  generateRandomPost,
  generateRandomUser,
  generateRate,
} from '@test-data-generators';
import { signUpRequest } from '@test-utils/request-auth';
import { ERRORS } from '@errors';
import { POST_RATE_VALUE } from '@constants/index';

/**
 * Create voted post state in the database:
 * - Create other than the current user
 * - Create a post by the other user
 * - Makes that new post voted by the current user
 * */
async function createVotedOtherUserPost(
  currentUser: UserDocument,
  isNegative: boolean,
) {
  const otherUser = await UserModel.create(generateRandomUser());

  const otherUserPost = await PostModel.create(
    generateRandomPost({
      author: otherUser._id,
    }),
  );

  const rate = await RateModel.create(
    generateRate({
      target: otherUserPost._id,
      negative: isNegative,
      targetModel: RateTargetModel.POST,
    }),
  );

  await UserModel.findByIdAndUpdate(currentUser.id, {
    $push: { rates: rate._id },
  });

  return {
    otherUserPost,
    otherUser,
    rate,
  };
}

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

    const post = await PostModel.create(
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

  it.each([true, false])(
    'Should return status 403 and an expected message when user tries to vote for a post in the same direction (negative: %s) which they have already voted',
    async (isNegative) => {
      const { sessionCookie, currentUser } = await signUpRequest(global.app);

      const { otherUserPost } = await createVotedOtherUserPost(
        currentUser,
        isNegative,
      );

      const response = await request(global.app)
        .put(`/api/posts/${otherUserPost._id}/vote`)
        .send({ negative: isNegative })
        .set('Cookie', sessionCookie);

      expect(response.status).toBe(403);
      expect(response.body.error.message).toBe(
        ERRORS.POST_CANT_RATE_ALREADY_RATED,
      );
    },
  );

  describe('The post has not been rated by the current user yet', () => {
    it('Should create a new "Post" rate in the database', async () => {
      const { sessionCookie } = await signUpRequest(global.app);

      const otherUser = await UserModel.create(generateRandomUser());

      const post = await PostModel.create(
        generateRandomPost({
          author: otherUser._id,
        }),
      );

      const response = await request(global.app)
        .put(`/api/posts/${post._id}/vote`)
        .send({ negative: true })
        .set('Cookie', sessionCookie);

      const rate = await RateModel.findOne({ target: post._id });

      expect(response.status).toBe(200);
      expect(rate).toBeDefined();
      expect(rate!.target.toString()).toBe(post._id.toString());
      expect(rate!.targetModel).toBe(RateTargetModel.POST);
      expect(rate!.negative).toBe(true);
    });

    it.each([
      ['increase', false],
      ['decrease', true],
    ])(
      'Should %s the post rating after the post is rated (negative: %s)',
      async (_, isNegative) => {
        const { sessionCookie } = await signUpRequest(global.app);

        const otherUser = await UserModel.create(generateRandomUser());

        const otherUserPost = await PostModel.create(
          generateRandomPost({
            author: otherUser._id,
          }),
        );

        await request(global.app)
          .put(`/api/posts/${otherUserPost._id}/vote`)
          .send({ negative: isNegative })
          .set('Cookie', sessionCookie);

        const votedPost = await PostModel.findById(otherUserPost._id);

        const rateValue = isNegative ? -POST_RATE_VALUE : POST_RATE_VALUE;

        expect(otherUserPost.rating).toBe(votedPost!.rating - rateValue);
      },
    );

    it.each([
      ['increase', false],
      ['decrease', true],
    ])(
      "Should %s author's rating after the post is rated (negative: %s)",
      async (_, isNegative) => {
        const { sessionCookie } = await signUpRequest(global.app);

        const otherUser = await UserModel.create(generateRandomUser());

        const otherUserPost = await PostModel.create(
          generateRandomPost({
            author: otherUser._id,
          }),
        );

        await request(global.app)
          .put(`/api/posts/${otherUserPost._id}/vote`)
          .send({ negative: isNegative })
          .set('Cookie', sessionCookie);

        const updatedOtherUser = await UserModel.findById(otherUser._id);

        const rateValue = isNegative ? -POST_RATE_VALUE : POST_RATE_VALUE;

        expect(otherUser.rating).toBe(updatedOtherUser!.rating - rateValue);
      },
    );

    it('Should return the updated post with changed rating after vote', async () => {
      const { sessionCookie } = await signUpRequest(global.app);

      const otherUser = await UserModel.create(generateRandomUser());

      const otherUserPost = await PostModel.create(
        generateRandomPost({
          author: otherUser._id,
        }),
      );

      const response = await request(global.app)
        .put(`/api/posts/${otherUserPost._id}/vote`)
        .send({ negative: true })
        .set('Cookie', sessionCookie);

      expect(response.status).toBe(200);
      expect(response.body.rating).toBe(otherUserPost.rating + -POST_RATE_VALUE);
    });
  });

  describe('The post has been rated by the current user - voting in the opposite direction', () => {
    it.each([true, false])(
      'Should update the existing post rate in the database (negative: %s)',
      async (isNegative) => {
        const { sessionCookie, currentUser } = await signUpRequest(global.app);

        const { otherUserPost } = await createVotedOtherUserPost(
          currentUser,
          !isNegative,
        );

        const response = await request(global.app)
          .put(`/api/posts/${otherUserPost._id}/vote`)
          .send({ negative: isNegative })
          .set('Cookie', sessionCookie);

        const updatedRate = await RateModel.findOne({
          target: otherUserPost._id,
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

        const { otherUserPost } = await createVotedOtherUserPost(
          currentUser,
          !isNegative,
        );

        await request(global.app)
          .put(`/api/posts/${otherUserPost._id}/vote`)
          .send({ negative: isNegative })
          .set('Cookie', sessionCookie);

        const ratedPost = await PostModel.findById(otherUserPost._id);

        const rateValue = isNegative ? -POST_RATE_VALUE : POST_RATE_VALUE;

        expect(otherUserPost.rating).toBe(ratedPost!.rating - rateValue * 2);
      },
    );

    it.each([
      ['increase', false],
      ['decrease', true],
    ])(
      "Should twice %s author's rating after the post is rated",
      async (_, isNegative) => {
        const { sessionCookie, currentUser } = await signUpRequest(global.app);

        const { otherUserPost, otherUser } = await createVotedOtherUserPost(
          currentUser,
          !isNegative,
        );

        await request(global.app)
          .put(`/api/posts/${otherUserPost._id}/vote`)
          .send({ negative: isNegative })
          .set('Cookie', sessionCookie);

        const updatedOtherUser = await UserModel.findById(otherUser._id);

        const rateValue = isNegative ? -POST_RATE_VALUE : POST_RATE_VALUE;

        expect(otherUser.rating).toBe(updatedOtherUser!.rating - rateValue * 2);
      },
    );

    it('Should return the updated post with changed rating after vote', async () => {
      const { sessionCookie, currentUser } = await signUpRequest(global.app);

      const isNegative = true;

      const { otherUserPost } = await createVotedOtherUserPost(
        currentUser,
        !isNegative,
      );

      const response = await request(global.app)
        .put(`/api/posts/${otherUserPost._id}/vote`)
        .send({ negative: isNegative })
        .set('Cookie', sessionCookie);

      expect(response.status).toBe(200);
      expect(response.body.rating).toBe(
        otherUserPost.rating + -POST_RATE_VALUE * 2,
      );
    });
  });
});
