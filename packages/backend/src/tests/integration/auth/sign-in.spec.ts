import request from 'supertest';
import { signUpRequest } from '../../utils/request-auth';
import { ERRORS } from '../../../errors/index';

describe('POST api/auth/signin', () => {
  it('Returns status 422 and an expected message for not filled all fields (only email)', async () => {
    const response = await request(global.app).post('/api/auth/signin').send({
      email: 'test-user@test.com',
    });

    expect(response.status).toBe(422);
    expect(response.body.error.message).toBe(ERRORS.AUTH_FIELDS_REQUIRED);
  });

  it('Returns status 422 and an expected message for not filled all fields (only password)', async () => {
    const response = await request(global.app).post('/api/auth/signin').send({
      password: '123456',
    });

    expect(response.status).toBe(422);
    expect(response.body.error.message).toBe(ERRORS.AUTH_FIELDS_REQUIRED);
  });

  it('Returns status 422 and an expected message for password length less than 6', async () => {
    const response = await request(global.app).post('/api/auth/signin').send({
      email: 'test-user@test.com',
      password: '12345',
    });

    expect(response.status).toBe(422);
    expect(response.body.error.message).toBe(ERRORS.AUTH_PASSWORD_TOO_SHORT);
  });

  it('Returns status 422 and an expected message for email not valid', async () => {
    const response = await request(global.app).post('/api/auth/signin').send({
      email: 'current-user@gmail',
      password: '123456',
    });

    expect(response.status).toBe(422);
    expect(response.body.error.message).toBe(ERRORS.AUTH_INVALID_EMAIL);
  });

  it('Returns status 401 and an expected message if email or password is wrong (wrong email)', async () => {
    const { currentUser } = await signUpRequest(global.app);

    const response = await request(global.app)
      .post('/api/auth/signin')
      .send({
        email: `${currentUser.email}-wrong`,
        password: '123456',
      });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe(ERRORS.AUTH_INVALID_CREDENTIALS);
  });

  it('Returns status 401 and an expected message if email or password is wrong (wrong password)', async () => {
    const { currentUser } = await signUpRequest(global.app);

    const response = await request(global.app).post('/api/auth/signin').send({
      email: currentUser.email,
      password: '123456-wrong', // signUpRequest uses 123456
    });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe(ERRORS.AUTH_INVALID_CREDENTIALS);
  });

  it('Returns status 200 and isAuth=true with the user data if credentials are correct', async () => {
    const { currentUser } = await signUpRequest(global.app);

    const response = await request(global.app).post('/api/auth/signin').send({
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

  it('Sets session cookies', async () => {
    const { currentUser } = await signUpRequest(global.app);

    const response = await request(global.app).post('/api/auth/signin').send({
      email: currentUser.email,
      password: '123456',
    });

    expect(response.headers['set-cookie']).toBeDefined();
  });
});
