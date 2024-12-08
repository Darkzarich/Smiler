import request from 'supertest';
import App from '../../../app.js';
import { connectDB } from '../../../libs/db.js';
import { signUpRequest } from '../../utils/request-auth.js';

let app;
let db;

beforeAll(async () => {
  db = await connectDB();

  const resolvedApp = await App.startApp({ db });

  app = resolvedApp.app;
});

afterAll(async () => {
  await db.close();
});

beforeEach(async () => {
  await db.dropDatabase();
});

describe('POST api/auth/signin', () => {
  it('Returns status 422 and an expected message for not filled all fields (only email)', async () => {
    const response = await request(app).post('/api/auth/signin').send({
      email: 'current-user@gmail.com',
    });

    expect(response.status).toBe(422);
    expect(response.body.error.message).toBe('All fields must be filled.');
  });

  it('Returns status 422 and an expected message for not filled all fields (only password)', async () => {
    const response = await request(app).post('/api/auth/signin').send({
      password: '123456',
    });

    expect(response.status).toBe(422);
    expect(response.body.error.message).toBe('All fields must be filled.');
  });

  it('Returns status 422 and an expected message for password length less than 6', async () => {
    const response = await request(app).post('/api/auth/signin').send({
      email: 'current-user@gmail.com',
      password: '12345',
    });

    expect(response.status).toBe(422);
    expect(response.body.error.message).toBe(
      'Password length must be not less than 6',
    );
  });

  it('Returns status 422 and an expected message for email not valid', async () => {
    const response = await request(app).post('/api/auth/signin').send({
      email: 'current-user@gmail',
      password: '123456',
    });

    expect(response.status).toBe(422);
    expect(response.body.error.message).toBe('Email must be valid');
  });

  it('Returns status 401 and an expected message if email or password is wrong (wrong email)', async () => {
    const { currentUser } = await signUpRequest(app);

    const response = await request(app)
      .post('/api/auth/signin')
      .send({
        email: `${currentUser.email}-wrong`,
        password: '123456',
      });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Invalid email or password');
  });

  it('Returns status 401 and an expected message if email or password is wrong (wrong password)', async () => {
    const { currentUser } = await signUpRequest(app);

    const response = await request(app).post('/api/auth/signin').send({
      email: currentUser.email,
      password: '123456-wrong', // signUpRequest uses 123456
    });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Invalid email or password');
  });

  it('Returns status 200 and isAuth=true with the user data if credentials are correct', async () => {
    const { currentUser } = await signUpRequest(app);

    const response = await request(app).post('/api/auth/signin').send({
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
});
