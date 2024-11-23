import request from 'supertest';
import App from '../../../app.js';
import { connectDB } from '../../../libs/db.js';

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

describe('GET /posts/feed', () => {
  it('Should return status 401 and a message for not signed in user', async () => {
    const response = await request(app).get('/api/posts/feed');

    expect(response.body.error.message).toBe(
      'Auth is required for this operation. Please sign in.',
    );
    expect(response.status).toBe(401);
  });
});
