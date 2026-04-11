import request from 'supertest';
import { SESSION_COOKIE_NAME } from '@constants/index';
import { findSessionCookie, signUpRequest } from '@test-utils/request-auth';
import { ERRORS } from '@errors';

describe('POST api/auth/logout', () => {
  it('Deletes the session cookie', async () => {
    const { sessionCookie, csrfToken } = await signUpRequest(global.app);

    const response = await request(global.app)
      .post('/api/auth/logout')
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    const anotherResponse = await request(global.app)
      .delete(`/api/posts/1234/vote`)
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    expect(response.status).toBe(200);
    expect(findSessionCookie(response.headers['set-cookie'])).toContain(
      `${SESSION_COOKIE_NAME}=;`,
    );
    expect(anotherResponse.status).toBe(401);
    expect(anotherResponse.body.error.message).toBe(ERRORS.UNAUTHORIZED);
  });
});
