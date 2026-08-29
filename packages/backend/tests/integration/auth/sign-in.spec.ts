import crypto from 'node:crypto';
import request from 'supertest';
import { SESSION_COOKIE_NAME } from '@constants/index';
import { UserModel } from '@models/User';
import { CURRENT_HASH_PARAMS, LEGACY_HASH_PARAMS } from '@utils/password';
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

  /** Rewrites a user's password the way it was stored before `hashParams` */
  async function storeLegacyPassword(userId: string, password: string) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto
      .pbkdf2Sync(
        password,
        salt,
        LEGACY_HASH_PARAMS.iterations,
        LEGACY_HASH_PARAMS.keyLength,
        LEGACY_HASH_PARAMS.digest,
      )
      .toString('hex');

    await UserModel.updateOne(
      { _id: userId },
      { $set: { hash, salt }, $unset: { hashParams: '' } },
    );

    return { hash, salt };
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
      _id: currentUser._id.toString(),
      login: currentUser.login,
      avatar: currentUser.avatar,
      email: currentUser.email,
      tagsFollowed: currentUser.tagsFollowed,
      followersAmount: currentUser.followersAmount,
      rating: currentUser.rating,
    });
  });

  it('Returns status 200 if the email casing differs from the stored one', async () => {
    const { currentUser } = await signUpRequest(global.app);

    const response = await signIn({
      email: currentUser.email.toUpperCase(),
      password: '123456',
    });

    expect(response.status).toBe(200);
    expect(response.body.isAuth).toBe(true);
    expect(response.body._id).toBe(currentUser._id.toString());
  });

  it('Returns status 200 for a password hashed before hashParams existed', async () => {
    const { currentUser } = await signUpRequest(global.app);

    await storeLegacyPassword(currentUser._id, '123456');

    const response = await signIn({
      email: currentUser.email,
      password: '123456',
    });

    expect(response.status).toBe(200);
    expect(response.body.isAuth).toBe(true);
  });

  it('Returns status 401 for a wrong password of a legacy hashed user', async () => {
    const { currentUser } = await signUpRequest(global.app);

    const legacy = await storeLegacyPassword(currentUser._id, '123456');

    const response = await signIn({
      email: currentUser.email,
      password: '123456-wrong',
    });

    expect(response.status).toBe(401);

    const user = await UserModel.findOne({ _id: currentUser._id }).lean();

    expect(user!.hash).toBe(legacy.hash);
    expect(user!.hashParams).toBeUndefined();
  });

  it('Re-hashes a legacy password with the current params on a successful sign in', async () => {
    const { currentUser } = await signUpRequest(global.app);

    const legacy = await storeLegacyPassword(currentUser._id, '123456');

    await signIn({ email: currentUser.email, password: '123456' });

    const user = await UserModel.findOne({ _id: currentUser._id }).lean();

    expect(user!.hashParams).toMatchObject(CURRENT_HASH_PARAMS);
    expect(user!.salt).not.toBe(legacy.salt);
    expect(user!.hash).toBe(
      crypto
        .pbkdf2Sync(
          '123456',
          user!.salt,
          CURRENT_HASH_PARAMS.iterations,
          CURRENT_HASH_PARAMS.keyLength,
          CURRENT_HASH_PARAMS.digest,
        )
        .toString('hex'),
    );

    const response = await signIn({
      email: currentUser.email,
      password: '123456',
    });

    expect(response.status).toBe(200);
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
