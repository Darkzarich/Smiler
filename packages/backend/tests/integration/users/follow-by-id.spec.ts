import request from 'supertest';
import { UserModel } from '@models/User';
import { ERRORS } from '@errors';
import { signUpRequest } from '@test-utils/request-auth';
import { generateRandomUser } from '@test-data-generators';

describe('PUT /users/:id/follow', () => {
  it('Should return status 401 and an expected message if user is not signed in', async () => {
    const response = await request(global.app).put('/api/users/1234/follow');

    expect(response.body.error.message).toBe(ERRORS.UNAUTHORIZED);
    expect(response.status).toBe(401);
  });

  it('Should return status 404 and an expected message when user is not found', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const otherUser = await UserModel.create(generateRandomUser());

    await UserModel.deleteOne({ _id: otherUser._id });

    const response = await request(global.app)
      .put(`/api/users/6766ab495b84f675bbbbfdcd/follow`)
      .set('Cookie', sessionCookie);

    expect(response.body.error.message).toBe(ERRORS.USER_NOT_FOUND);
    expect(response.status).toBe(404);
  });

  it('Should return status 403 and an expected message when user tries to follow their own', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const response = await request(global.app)
      .put(`/api/users/${currentUser.id}/follow`)
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(403);
    expect(response.body.error.message).toBe(ERRORS.USER_CANT_FOLLOW_OWN);
  });

  it('Should return status 403 and an expected message when user tries to follow a user that they have already followed', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const otherUser = await UserModel.create(generateRandomUser());

    await UserModel.findByIdAndUpdate(currentUser.id, {
      $push: { usersFollowed: otherUser.id },
    });

    const response = await request(global.app)
      .put(`/api/users/${otherUser.id}/follow`)
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(403);
    expect(response.body.error.message).toBe(
      ERRORS.USER_CANT_FOLLOW_ALREADY_FOLLOWED,
    );
  });

  it('Should add followed user to usersFollowed field of the current user in the database', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const otherUser = await UserModel.create(generateRandomUser());

    const response = await request(global.app)
      .put(`/api/users/${otherUser.id}/follow`)
      .set('Cookie', sessionCookie);

    const updatedUser = await UserModel.findOne(
      { _id: currentUser.id },
      { usersFollowed: 1 },
    ).lean();

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
    expect(updatedUser!.usersFollowed.map((el) => el.toString())).toEqual([
      otherUser.id,
    ]);
  });

  it("Should increase user's followersAmount after being followed", async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const otherUser = await UserModel.create(generateRandomUser());

    await request(global.app)
      .put(`/api/users/${otherUser.id}/follow`)
      .set('Cookie', sessionCookie);

    const updatedOtherUser = await UserModel.findOne(
      { _id: otherUser.id },
      { followersAmount: 1 },
    ).lean();

    expect(updatedOtherUser!.followersAmount).toBe(
      otherUser.followersAmount + 1,
    );
  });
});
