import request from 'supertest';
import { signUpRequest } from '../../utils/request-auth.js';
import { ERRORS } from '../../../errors/index.js';

describe('POST api/auth/logout', () => {
  it('Deletes the session cookie', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .post('/api/auth/logout')
      .set('Cookie', sessionCookie);

    const anotherResponse = await request(global.app)
      .delete(`/api/posts/1234/vote`)
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    expect(anotherResponse.status).toBe(401);
    expect(anotherResponse.body.error.message).toBe(ERRORS.UNAUTHORIZED);
  });
});
