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
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

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

    await UserModel.updateOne({ _id: currentUser.id }, { $set: { template } });

    const response = await request(global.app)
      .get(`/api/users/me/template`)
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(template);
  });
});
