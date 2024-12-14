import request from 'supertest';
import {
  USER_MAX_AVATAR_LENGTH,
  USER_MAX_BIO_LENGTH,
} from '../../../constants/index.js';
import User from '../../../models/User.js';

import { signUpRequest } from '../../utils/request-auth.js';
import { ERRORS } from '../../../errors/index.js';

describe('PUT /users/me', () => {
  it('Should return status 401 and an expected message for not signed in user', async () => {
    const response = await request(global.app).put(`/api/users/me`);

    expect(response.body.error.message).toBe(ERRORS.UNAUTHORIZED);
    expect(response.status).toBe(401);
  });

  it('Should return status 422 and an expected db validation message for a too long bio', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .put('/api/users/me')
      .send({
        bio: 'a'.repeat(USER_MAX_BIO_LENGTH + 1),
      })
      .set('Cookie', sessionCookie);

    expect(response.body.error.message).toContain(
      'longer than the maximum allowed length',
    );
    expect(response.status).toBe(422);
  });

  it('Should return status 422 and an expected db validation message if avatar is not an url', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .put('/api/users/me')
      .send({
        avatar: 'a',
      })
      .set('Cookie', sessionCookie);

    expect(response.body.error.message).toContain('is not an url');
    expect(response.status).toBe(422);
  });

  it('Should return status 422 and an expected db validation message for too long avatar', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .put('/api/users/me')
      .send({
        avatar: `https://${'a'.repeat(USER_MAX_AVATAR_LENGTH)}.jpg`,
      })
      .set('Cookie', sessionCookie);

    expect(response.body.error.message).toContain(
      'longer than the maximum allowed length',
    );
    expect(response.status).toBe(422);
  });

  it('Should return status 404 and en expected message for not found user', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    await User.deleteOne({ _id: currentUser.id });

    const response = await request(global.app)
      .put('/api/users/me')
      .send({ bio: 'a' })
      .set('Cookie', sessionCookie);

    expect(response.body.error.message).toBe(ERRORS.USER_NOT_FOUND);
    expect(response.status).toBe(404);
  });

  it('Returns status 200 and the updated user after a successful update', async () => {
    const bio = 'a';
    const avatar = 'https://example.com/avatar.jpg';

    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .put('/api/users/me')
      .send({ bio, avatar })
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body.bio).toBe(bio);
    expect(response.body.avatar).toBe(avatar);
  });
});
