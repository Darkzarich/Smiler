import { Types } from 'mongoose';
import request from 'supertest';
import { RateModel, RateTargetModel } from '@models/Rate';
import { UserModel } from '@models/User';
import { generateRandomUser, generateRate } from '@test-data-generators';
import { signUpRequest } from '@test-utils/request-auth';
import { VOTE_LOOKUP_MAX_IDS } from '@constants/index';
import { ERRORS } from '@errors';

const url = '/api/comments/votes';

const newId = () => new Types.ObjectId();

describe('GET /comments/votes', () => {
  it('Should return status 401 and an expected message if user is not signed in', async () => {
    const response = await request(global.app).get(url).query({ ids: newId() });

    expect(response.body.error.message).toBe(ERRORS.UNAUTHORIZED);
    expect(response.status).toBe(401);
  });

  it.each([
    ['no ids are given', {}, ERRORS.VOTE_LOOKUP_IDS_REQUIRED],
    ['an id is malformed', { ids: `${newId()},1234` }, ERRORS.INVALID_ID],
    [
      `more than ${VOTE_LOOKUP_MAX_IDS} ids are given`,
      { ids: Array.from({ length: VOTE_LOOKUP_MAX_IDS + 1 }, newId).join(',') },
      ERRORS.VOTE_LOOKUP_TOO_MANY_IDS,
    ],
  ])('Should return status 422 if %s', async (_, query, message) => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .get(url)
      .query(query)
      .set('Cookie', sessionCookie);

    expect(response.body.error.message).toBe(message);
    expect(response.status).toBe(422);
  });

  it('Should return how the current user voted on each of the ids', async () => {
    const { currentUser, sessionCookie } = await signUpRequest(global.app);
    const otherUser = await UserModel.create(generateRandomUser());

    const [upvoted, downvoted, votedByOther, votedOnPost, notVoted] =
      Array.from({ length: 5 }, newId);

    await RateModel.create([
      generateRate({
        user: currentUser._id,
        target: upvoted,
        negative: false,
        targetModel: RateTargetModel.COMMENT,
      }),
      generateRate({
        user: currentUser._id,
        target: downvoted,
        negative: true,
        targetModel: RateTargetModel.COMMENT,
      }),
      generateRate({
        user: otherUser._id,
        target: votedByOther,
        targetModel: RateTargetModel.COMMENT,
      }),
      generateRate({
        user: currentUser._id,
        target: votedOnPost,
        targetModel: RateTargetModel.POST,
      }),
    ]);

    const response = await request(global.app)
      .get(url)
      .query({
        ids: [upvoted, downvoted, votedByOther, votedOnPost, notVoted].join(
          ',',
        ),
      })
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      [upvoted.toString()]: { isRated: true, negative: false },
      [downvoted.toString()]: { isRated: true, negative: true },
      [votedByOther.toString()]: { isRated: false },
      [votedOnPost.toString()]: { isRated: false },
      [notVoted.toString()]: { isRated: false },
    });
  });
});
