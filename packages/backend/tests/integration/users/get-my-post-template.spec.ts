import request from 'supertest';
import { UserModel } from '@models/User';
import { signUpRequest } from '@test-utils/request-auth';
import { ERRORS } from '@errors';

describe('GET /users/me/template', () => {
  it('Should return status 401 and an expected message if user is not signed in', async () => {
    const response = await request(global.app).get(`/api/users/me/template`);

    expect(response.body.error.message).toBe(ERRORS.UNAUTHORIZED);
    expect(response.status).toBe(401);
  });

  it('Should return status 200 and the template', async () => {
    const { sessionCookie, csrfToken, currentUser } = await signUpRequest(
      global.app,
    );

    const template = {
      title: 'test-title',
      tags: ['test-tag'],
      sections: [
        {
          title: 'test-section-title',
          content: 'test-section-content',
        },
      ],
    };

    await UserModel.updateOne({ _id: currentUser._id }, { $set: { template } });

    const response = await request(global.app)
      .get(`/api/users/me/template`)
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(template);
  });

  it('Should return the time the template was last saved', async () => {
    const { sessionCookie, csrfToken, currentUser } = await signUpRequest(
      global.app,
    );

    const updatedAt = new Date('2026-09-13T10:00:00.000Z');

    await UserModel.updateOne(
      { _id: currentUser._id },
      { $set: { 'template.updatedAt': updatedAt } },
    );

    const response = await request(global.app)
      .get(`/api/users/me/template`)
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    expect(response.status).toBe(200);
    expect(response.body.updatedAt).toBe(updatedAt.toISOString());
  });
});
