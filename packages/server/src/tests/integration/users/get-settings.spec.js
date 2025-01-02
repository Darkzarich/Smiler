import request from 'supertest';
import User from '../../../models/User.js';
import { signUpRequest } from '../../utils/request-auth.js';
import { ERRORS } from '../../../errors/index.js';

describe('GET /users/me/settings', () => {
  it('Should return status 401 and an expected message if user is not signed in', async () => {
    const response = await request(global.app).get(`/api/users/me/settings`);

    expect(response.body.error.message).toBe(ERRORS.UNAUTHORIZED);
    expect(response.status).toBe(401);
  });

  it('Should return status 404 and en expected message for not found user', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    await User.deleteOne({ _id: currentUser.id });

    const response = await request(global.app)
      .get('/api/users/me/settings')
      .set('Cookie', sessionCookie);

    expect(response.body.error.message).toBe(ERRORS.USER_NOT_FOUND);
    expect(response.status).toBe(404);
  });

  it('Returns status 200 and current user settings', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    await User.findByIdAndUpdate(currentUser.id, {
      $push: { tagsFollowed: 'test-tag', usersFollowed: currentUser.id },
      $set: { bio: 'test-bio', avatar: 'test-avatar' },
    });

    const response = await request(global.app)
      .get('/api/users/me/settings')
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      tags: ['test-tag'],
      authors: [
        {
          _id: currentUser.id,
          login: currentUser.login,
          avatar: 'test-avatar',
        },
      ],
      bio: 'test-bio',
      avatar: 'test-avatar',
    });
  });
});
