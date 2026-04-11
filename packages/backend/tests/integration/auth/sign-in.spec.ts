import request from 'supertest';
import { SESSION_COOKIE_NAME } from '@constants/index';
import {
  csrfRequest,
  findSessionCookie,
  getCookieValue,
  signUpRequest,
} from '@test-utils/request-auth';
import { ERRORS } from '@errors';

describe('POST api/auth/signin', () => {
  async function signIn(data: Record<string, unknown>) {
    const { csrfCookie, csrfToken } = await csrfRequest(global.app);

    return request(global.app)
      .post('/api/auth/signin')
      .set('Cookie', csrfCookie)
      .set('X-CSRF-Token', csrfToken)
      .send(data);
  }

  it('Returns status 422 and an expected message for not filled all fields (only email)', async () => {
    const response = await signIn({
      email: 'test-user@test.com',
    });

    expect(response.status).toBe(422);
    expect(response.body.error.message).toBe(ERRORS.AUTH_FIELDS_REQUIRED);
  });

  it('Returns status 422 and an expected message for not filled all fields (only password)', async () => {
    const response = await signIn({
      password: '123456',
    });

    expect(response.status).toBe(422);
    expect(response.body.error.message).toBe(ERRORS.AUTH_FIELDS_REQUIRED);
  });

  it('Returns status 422 and an expected message for password length less than 6', async () => {
    const response = await signIn({
      email: 'test-user@test.com',
      password: '12345',
    });

    expect(response.status).toBe(422);
    expect(response.body.error.message).toBe(ERRORS.AUTH_PASSWORD_TOO_SHORT);
  });

  it('Returns status 422 and an expected message for email not valid', async () => {
    const response = await signIn({
      email: 'current-user@gmail',
      password: '123456',
    });

    expect(response.status).toBe(422);
    expect(response.body.error.message).toBe(ERRORS.AUTH_INVALID_EMAIL);
  });

  it('Returns status 401 and an expected message if email or password is wrong (wrong email)', async () => {
    const { currentUser } = await signUpRequest(global.app);

    const response = await signIn({
      email: `${currentUser.email}-wrong`,
      password: '123456',
    });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe(ERRORS.AUTH_INVALID_CREDENTIALS);
  });

  it('Returns status 401 and an expected message if email or password is wrong (wrong password)', async () => {
    const { currentUser } = await signUpRequest(global.app);

    const response = await signIn({
      email: currentUser.email,
      password: '123456-wrong', // signUpRequest uses 123456
    });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe(ERRORS.AUTH_INVALID_CREDENTIALS);
  });

  it('Returns status 200 and isAuth=true with the user data if credentials are correct', async () => {
    const { currentUser } = await signUpRequest(global.app);

    const response = await signIn({
      email: currentUser.email,
      password: '123456',
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      isAuth: true,
      id: currentUser.id.toString(),
      login: currentUser.login,
      avatar: currentUser.avatar,
      email: currentUser.email,
      tagsFollowed: currentUser.tagsFollowed,
      followersAmount: currentUser.followersAmount,
      rating: currentUser.rating,
    });
  });

  it('Regenerates the session and sets the custom session cookie', async () => {
    const { currentUser } = await signUpRequest(global.app);
    const { csrfCookie, csrfToken } = await csrfRequest(global.app);

    const response = await request(global.app)
      .post('/api/auth/signin')
      .set('Cookie', csrfCookie)
      .set('X-CSRF-Token', csrfToken)
      .send({
        email: currentUser.email,
        password: '123456',
      });

    const sessionCookie = findSessionCookie(response.headers['set-cookie']);

    expect(sessionCookie).toBeDefined();
    expect(sessionCookie).toContain(`${SESSION_COOKIE_NAME}=`);
    expect(getCookieValue(sessionCookie!)).not.toBe(getCookieValue(csrfCookie));
  });
});
