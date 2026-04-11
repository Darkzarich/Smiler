import type { Express } from 'express';
import request from 'supertest';

export async function csrfRequest(app: Express) {
  const response = await request(app).get('/api/auth/csrf');

  return {
    csrfCookie: response.headers['set-cookie'][0],
    csrfToken: response.body.csrfToken as string,
  };
}

/** Signs up a test user and returns a session cookie and the user object
 * it's important for test cases that require a logged in user
 */
export async function signUpRequest(app: Express) {
  const { csrfCookie, csrfToken } = await csrfRequest(app);

  const response = await request(app)
    .post('/api/auth/signup')
    .set('Cookie', csrfCookie)
    .set('X-CSRF-Token', csrfToken)
    .send({
      login: 'currentUser',
      email: 'test-user@test.com',
      password: '123456',
      confirm: '123456',
    });

  const sessionCookie = response.headers['set-cookie'][0];

  return {
    currentUser: response.body,
    csrfToken,
    sessionCookie,
  };
}
