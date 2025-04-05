import request from 'supertest';
import { UserModel } from '../../../src/models/User';
import { generateRandomUser } from '../../data-generators/index';
import { signUpRequest } from '../../utils/request-auth';
import { ERRORS } from '../../../src/errors';

describe('GET /users/:id', () => {
  it('Should return status 404 for not existing user', async () => {
    const user = await UserModel.create(generateRandomUser());

    await UserModel.deleteOne({ _id: user._id });

    const response = await request(global.app).get(`/api/users/${user.login}`);

    expect(response.body.error.message).toBe(ERRORS.USER_NOT_FOUND);
    expect(response.status).toBe(404);
  });

  it("Should return status 200 and a other user's profile with all expected fields", async () => {
    const user = await UserModel.create(
      generateRandomUser({
        bio: 'test',
      }),
    );

    const response = await request(global.app).get(`/api/users/${user.login}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: user._id.toString(),
      login: user.login,
      bio: user.bio,
      avatar: user.avatar,
      followersAmount: user.followersAmount,
      rating: user.rating,
      createdAt: user.createdAt.toJSON(),
      isFollowed: false,
    });
  });

  it('Should return status 200 and the current user profile with all expected fields', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const response = await request(global.app)
      .get(`/api/users/${currentUser.login}`)
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: response.body.id.toString(),
      login: response.body.login,
      bio: response.body.bio,
      avatar: response.body.avatar,
      followersAmount: response.body.followersAmount,
      rating: response.body.rating,
      createdAt: response.body.createdAt,
    });
  });

  it('Should return isFollowed=true if requested other user is followed by the current user', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const otherUser = await UserModel.create(generateRandomUser());

    await UserModel.findByIdAndUpdate(currentUser.id, {
      $push: { usersFollowed: otherUser.id },
    });

    const response = await request(global.app)
      .get(`/api/users/${otherUser.login}`)
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body.isFollowed).toBe(true);
  });
});
