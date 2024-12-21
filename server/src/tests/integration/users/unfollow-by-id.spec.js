import request from 'supertest';
import User from '../../../models/User.js';
import { generateRandomUser } from '../../data-generators/index.js';
import { signUpRequest } from '../../utils/request-auth.js';
import { ERRORS } from '../../../errors/index.js';

describe('DELETE /users/:id/follow', () => {
  it('Should return status 401 and an expected message for not signed in user', async () => {
    const response = await request(global.app).delete('/api/users/1234/follow');

    expect(response.body.error.message).toBe(ERRORS.UNAUTHORIZED);
    expect(response.status).toBe(401);
  });

  it('Should return status 404 and an expected message when user is not found', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const otherUser = await User.create(generateRandomUser());

    await User.deleteOne({ _id: otherUser._id });

    const response = await request(global.app)
      .delete(`/api/users/6766ab495b84f675bbbbfdcd/follow`)
      .set('Cookie', sessionCookie);

    expect(response.body.error.message).toBe(ERRORS.USER_NOT_FOUND);
    expect(response.status).toBe(404);
  });

  it('Should return status 403 and an expected message when user tries to unfollow their own', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const response = await request(global.app)
      .delete(`/api/users/${currentUser.id}/follow`)
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(403);
    expect(response.body.error.message).toBe(ERRORS.USER_CANT_UNFOLLOW_OWN);
  });

  it('Should return status 403 and an expected message when user tries to unfollow a user that they have not yet followed', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const otherUser = await User.create(generateRandomUser());

    const response = await request(global.app)
      .delete(`/api/users/${otherUser.id}/follow`)
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(403);
    expect(response.body.error.message).toBe(
      ERRORS.USER_CANT_UNFOLLOW_NOT_FOLLOWED,
    );
  });

  it('Should remove unfollowed user from usersFollowed field of the current user in the database', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const otherUser = await User.create(generateRandomUser());

    await User.findByIdAndUpdate(currentUser.id, {
      $push: { usersFollowed: otherUser.id },
    });

    const response = await request(global.app)
      .delete(`/api/users/${otherUser.id}/follow`)
      .set('Cookie', sessionCookie);

    const updatedUser = await User.findOne(
      { _id: currentUser.id },
      { usersFollowed: 1 },
    ).lean();

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
    expect(updatedUser.usersFollowed).toHaveLength(0);
  });

  it("Should decrease user's followersAmount after being unfollowed", async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const otherUser = await User.create(generateRandomUser());

    await User.findByIdAndUpdate(currentUser.id, {
      $push: { usersFollowed: otherUser.id },
    });

    await request(global.app)
      .delete(`/api/users/${otherUser.id}/follow`)
      .set('Cookie', sessionCookie);

    const updatedOtherUser = await User.findOne(
      { _id: otherUser.id },
      { followersAmount: 1 },
    ).lean();

    expect(updatedOtherUser.followersAmount).toBe(
      otherUser.followersAmount - 1,
    );
  });
});
