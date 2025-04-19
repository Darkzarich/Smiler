import crypto from 'crypto';
import request from 'supertest';
import { ERRORS } from '@errors';
import { UserModel } from '@models/User';

describe('POST api/auth/signup', () => {
  function generateSignUpCredentials() {
    return {
      email: 'test-user@test.com',
      password: '123456',
      confirm: '123456',
      login: 'Test123',
    };
  }

  it('Returns status 422 and an expected message for not filled all fields (only email)', async () => {
    const response = await request(global.app).post('/api/auth/signup').send({
      email: 'test-user@test.com',
    });

    expect(response.status).toBe(422);
    expect(response.body.error.message).toBe(ERRORS.AUTH_FIELDS_REQUIRED);
  });

  it('Returns status 422 and an expected message for not filled all fields (only password)', async () => {
    const response = await request(global.app).post('/api/auth/signup').send({
      password: '123456',
    });

    expect(response.status).toBe(422);
    expect(response.body.error.message).toBe(ERRORS.AUTH_FIELDS_REQUIRED);
  });

  it('Returns status 422 and an expected message for not filled all fields (only login)', async () => {
    const response = await request(global.app).post('/api/auth/signup').send({
      login: 'test',
    });

    expect(response.status).toBe(422);
    expect(response.body.error.message).toBe(ERRORS.AUTH_FIELDS_REQUIRED);
  });

  it('Returns status 422 and an expected message for not filled all fields (only confirm)', async () => {
    const response = await request(global.app).post('/api/auth/signup').send({
      confirm: '123456',
    });

    expect(response.status).toBe(422);
    expect(response.body.error.message).toBe(ERRORS.AUTH_FIELDS_REQUIRED);
  });

  it('Returns status 422 and an expected message for login length less than 3', async () => {
    const response = await request(global.app)
      .post('/api/auth/signup')
      .send({
        ...generateSignUpCredentials(),
        login: 'te',
      });

    expect(response.status).toBe(422);
    expect(response.body.error.message).toBe(ERRORS.AUTH_LOGIN_WRONG_LENGTH);
  });

  it('Returns status 422 and an expected message for login length more than 15', async () => {
    const response = await request(global.app)
      .post('/api/auth/signup')
      .send({
        ...generateSignUpCredentials(),
        login: 'test-test-test-test',
      });

    expect(response.status).toBe(422);
    expect(response.body.error.message).toBe(ERRORS.AUTH_LOGIN_WRONG_LENGTH);
  });

  it('Returns status 422 and an expected message for password length less than 6', async () => {
    const response = await request(global.app)
      .post('/api/auth/signup')
      .send({
        ...generateSignUpCredentials(),
        password: '12345',
      });

    expect(response.status).toBe(422);
    expect(response.body.error.message).toBe(ERRORS.AUTH_PASSWORD_TOO_SHORT);
  });

  it('Returns status 422 and an expected message if password and confirm not equal', async () => {
    const response = await request(global.app)
      .post('/api/auth/signup')
      .send({
        ...generateSignUpCredentials(),
        confirm: 'wrong-pass',
      });

    expect(response.status).toBe(422);
    expect(response.body.error.message).toBe(ERRORS.AUTH_PASSWORDS_NOT_EQUAL);
  });

  it('Returns status 422 and an expected message for email not valid', async () => {
    const response = await request(global.app)
      .post('/api/auth/signup')
      .send({
        ...generateSignUpCredentials(),
        email: 'current-user@gmail',
      });

    expect(response.status).toBe(422);
    expect(response.body.error.message).toBe(ERRORS.AUTH_INVALID_EMAIL);
  });

  it('Creates a user document in the database with hashed password and salt', async () => {
    const credentials = generateSignUpCredentials();

    const response = await request(global.app)
      .post('/api/auth/signup')
      .send(credentials);

    const user = await UserModel.findOne({ _id: response.body.id }).lean();

    const hash = crypto
      .pbkdf2Sync(credentials.password, user!.salt, 10000, 512, 'sha512')
      .toString('hex');

    expect(user).toMatchObject({
      login: credentials.login,
      email: credentials.email,
      hash,
      salt: expect.any(String),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((user as any).password).not.toBeDefined();
  });

  it('Returns status 409 and an expected message if user already exists', async () => {
    await UserModel.syncIndexes();

    const credentials = generateSignUpCredentials();

    await request(global.app).post('/api/auth/signup').send(credentials);

    const response = await request(global.app)
      .post('/api/auth/signup')
      .send(credentials);

    expect(response.status).toBe(409);
    expect(response.body.error.message).toBe(ERRORS.AUTH_CONFLICT);
  });

  it('Returns status 200 and isAuth=true with the user data after successful sign up', async () => {
    const credentials = generateSignUpCredentials();

    const response = await request(global.app)
      .post('/api/auth/signup')
      .send(credentials);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      isAuth: true,
      id: expect.any(String),
      login: credentials.login,
      avatar: '',
      email: credentials.email,
      tagsFollowed: [],
      followersAmount: 0,
      rating: 0,
    });
  });

  it('Sets session cookies', async () => {
    const response = await request(global.app)
      .post('/api/auth/signup')
      .send(generateSignUpCredentials());

    expect(response.headers['set-cookie']).toBeDefined();
  });
});
