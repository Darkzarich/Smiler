import request from 'supertest';
import { USER_MAX_AVATAR_LENGTH, USER_MAX_BIO_LENGTH } from '@constants/index';
import { UserModel } from '@models/User';

import { signUpRequest } from '@test-utils/request-auth';
import { ERRORS } from '@errors';

describe('PUT /users/me', () => {
  it('Should return status 401 and an expected message if user is not signed in', async () => {
    const response = await request(global.app).put(`/api/users/me`);

    expect(response.body.error.message).toBe(ERRORS.UNAUTHORIZED);
    expect(response.status).toBe(401);
  });

  it('Should return status 422 and an expected db validation message for a too long bio', async () => {
    const { sessionCookie, csrfToken } = await signUpRequest(global.app);

    const response = await request(global.app)
      .put('/api/users/me')
      .send({
        bio: 'a'.repeat(USER_MAX_BIO_LENGTH + 1),
      })
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    expect(response.body.error.message).toContain(
      'longer than the maximum allowed length',
    );
    expect(response.status).toBe(422);
  });

  it('Should return status 422 and an expected db validation message if avatar is not an url', async () => {
    const { sessionCookie, csrfToken } = await signUpRequest(global.app);

    const response = await request(global.app)
      .put('/api/users/me')
      .send({
        avatar: 'a',
      })
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    expect(response.body.error.message).toBe(ERRORS.USER_AVATAR_INVALID);
    expect(response.status).toBe(422);
  });

  it('Should return status 422 and an expected db validation message for too long avatar', async () => {
    const { sessionCookie, csrfToken } = await signUpRequest(global.app);

    const response = await request(global.app)
      .put('/api/users/me')
      .send({
        avatar: `https://example.com/${'a'.repeat(USER_MAX_AVATAR_LENGTH)}.jpg`,
      })
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    expect(response.body.error.message).toContain(
      'longer than the maximum allowed length',
    );
    expect(response.status).toBe(422);
  });

  it('Should ignore protected user fields', async () => {
    const { sessionCookie, csrfToken, currentUser } = await signUpRequest(
      global.app,
    );

    const response = await request(global.app)
      .put('/api/users/me')
      .send({
        bio: 'updated bio',
        rating: 100,
        email: 'attacker@example.com',
      })
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    const user = await UserModel.findById(currentUser._id).lean();

    expect(response.status).toBe(200);
    expect(response.body.bio).toBe('updated bio');
    expect(user?.bio).toBe('updated bio');
    expect(user?.rating).toBe(0);
    expect(user?.email).toBe(currentUser.email);
  });

  it('Should return status 422 and an expected message if an update field is not a string', async () => {
    const { sessionCookie, csrfToken } = await signUpRequest(global.app);

    const response = await request(global.app)
      .put('/api/users/me')
      .send({
        bio: ['updated bio'],
      })
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    expect(response.body.error.message).toBe(ERRORS.USER_UPDATE_FIELD_INVALID);
    expect(response.status).toBe(422);
  });

  it("Should return status 404 and an expected message if didn't find the user", async () => {
    const { sessionCookie, csrfToken, currentUser } = await signUpRequest(
      global.app,
    );

    await UserModel.deleteOne({ _id: currentUser._id });

    const response = await request(global.app)
      .put('/api/users/me')
      .send({ bio: 'a' })
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    expect(response.body.error.message).toBe(ERRORS.USER_NOT_FOUND);
    expect(response.status).toBe(404);
  });

  it('Returns status 200 and the updated user after a successful update', async () => {
    const bio = 'a';
    const avatar = 'https://example.com/avatar.jpg';

    const { sessionCookie, csrfToken } = await signUpRequest(global.app);

    const response = await request(global.app)
      .put('/api/users/me')
      .send({ bio, avatar })
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    expect(response.status).toBe(200);
    expect(response.body.bio).toBe(bio);
    expect(response.body.avatar).toBe(avatar);
    expect(response.body).toEqual({
      _id: expect.any(String),
      login: expect.any(String),
      rating: expect.any(Number),
      bio,
      avatar,
      followersAmount: expect.any(Number),
      createdAt: expect.any(String),
    });
    expect(response.body).not.toHaveProperty('password');
    expect(response.body).not.toHaveProperty('email');
    expect(response.body).not.toHaveProperty('hash');
    expect(response.body).not.toHaveProperty('salt');
  });
});
