import type { Express } from 'express';
import request from 'supertest';
import { SESSION_COOKIE_NAME } from '@constants/index';

export function findSetCookie(
  cookies: string | string[] | undefined,
  name: string,
) {
  const setCookies = Array.isArray(cookies) ? cookies : [cookies];

  return setCookies.find((cookie) => cookie?.startsWith(`${name}=`));
}

export function getCookieValue(cookie: string) {
  return cookie.split(';')[0].split('=')[1];
}

export function findSessionCookie(cookies: string | string[] | undefined) {
  return findSetCookie(cookies, SESSION_COOKIE_NAME);
}

export async function csrfRequest(app: Express) {
  const response = await request(app).get('/api/auth/csrf');
  const csrfCookie = findSessionCookie(response.headers['set-cookie']);

  if (!csrfCookie) {
    throw new Error(`${SESSION_COOKIE_NAME} cookie was not set`);
  }

  return {
    csrfCookie,
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

  const sessionCookie = findSessionCookie(response.headers['set-cookie']);

  if (!sessionCookie) {
    throw new Error(`${SESSION_COOKIE_NAME} cookie was not set`);
  }

  return {
    currentUser: response.body,
    csrfToken,
    sessionCookie,
  };
}
