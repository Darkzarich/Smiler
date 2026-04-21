import request from 'supertest';
import { ERRORS } from '@errors';
import { SESSION_COOKIE_NAME } from '@constants/index';
import { findSessionCookie, signUpRequest } from '@test-utils/request-auth';
import Config from '@config/index';

describe('CSRF protection', () => {
  it('Returns a CSRF token and session cookie', async () => {
    const response = await request(global.app).get('/api/auth/csrf');

    expect(response.status).toBe(200);
    expect(response.body.csrfToken).toEqual(expect.any(String));
    expect(findSessionCookie(response.headers['set-cookie'])).toContain(
      `${SESSION_COOKIE_NAME}=`,
    );
  });

  it('Rejects an authenticated write request without a CSRF token', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .post('/api/posts')
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(403);
    expect(response.body.error.message).toBe(ERRORS.CSRF_INVALID);
  });

  it('Rejects an authenticated write request with an invalid CSRF token', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .post('/api/posts')
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', 'invalid-token');

    expect(response.status).toBe(403);
    expect(response.body.error.message).toBe(ERRORS.CSRF_INVALID);
  });

  it('Rejects a valid CSRF token from a disallowed origin', async () => {
    const { sessionCookie, csrfToken } = await signUpRequest(global.app);

    const response = await request(global.app)
      .post('/api/posts')
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken)
      .set('Origin', 'https://evil.example');

    expect(response.status).toBe(403);
    expect(response.body.error.message).toBe(ERRORS.CSRF_INVALID);
  });

  it('Allows an authenticated write request with a valid token and allowed origin', async () => {
    const { sessionCookie, csrfToken } = await signUpRequest(global.app);

    const response = await request(global.app)
      .post('/api/posts')
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken)
      .set('Origin', Config.FRONT_ORIGIN_LOCAL);

    expect(response.status).toBe(422);
    expect(response.body.error.message).toBe(ERRORS.POST_TITLE_REQUIRED);
  });

  it('Does not require a CSRF token for safe methods', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const response = await request(global.app)
      .get('/api/auth/current')
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body._id).toBe(currentUser._id);
  });
});
