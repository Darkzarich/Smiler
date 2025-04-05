import request from 'supertest';
import { UserModel } from '../../../src/models/User';
import { signUpRequest } from '../../utils/request-auth';
import { ERRORS } from '../../../src/errors';

describe('GET /users/:id/template', () => {
  it('Should return status 401 and an expected message if user is not signed in', async () => {
    const response = await request(global.app).get(`/api/users/1234/template`);

    expect(response.body.error.message).toBe(ERRORS.UNAUTHORIZED);
    expect(response.status).toBe(401);
  });

  it('Should return status 403 and an expected message if user is not the owner of the template', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .get(`/api/users/1234/template`)
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(403);
    expect(response.body.error.message).toBe(ERRORS.TEMPLATE_CANT_SEE_NOT_OWN);
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
      .get(`/api/users/${currentUser.id}/template`)
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(template);
  });
});
