import request from 'supertest';
import User from '../../../models/User.js';
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

describe('GET api/auth/current', () => {
  it('Returns status 200 and isAuth=false', async () => {
    const response = await request(app).get('/api/auth/current');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      isAuth: false,
    });
  });

  it('Returns status 404 and not found error if the user was not found', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(app);

    // Imitating the deletion of the user for whatever reason
    await User.deleteOne({ _id: currentUser.id });

    const response = await request(app)
      .get('/api/auth/current')
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe('Not Found');
  });

  it('Returns status 200 and isAuth=true with the user data', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(app);

    const response = await request(app)
      .get('/api/auth/current')
      .set('Cookie', sessionCookie);

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
