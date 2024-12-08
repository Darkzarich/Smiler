import request from 'supertest';
import App from '../../../app.js';
import { connectDB } from '../../../libs/db.js';
import { signUpRequest } from '../../utils/request-auth.js';
import { ERRORS } from '../../../errors/index.js';

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

describe('POST api/auth/logout', () => {
  it('Deletes the session cookie', async () => {
    const { sessionCookie } = await signUpRequest(app);

    const response = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', sessionCookie);

    const anotherResponse = await request(app)
      .delete(`/api/posts/1234/vote`)
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    expect(anotherResponse.status).toBe(401);
    expect(anotherResponse.body.error.message).toBe(ERRORS.UNAUTHORIZED);
  });
});
