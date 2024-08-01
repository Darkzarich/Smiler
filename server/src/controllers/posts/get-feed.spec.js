const request = require('supertest');
const { startApp } = require('../../app');
const { connectDB } = require('../../libs/db');

let app;
let db;

beforeAll(async () => {
  db = await connectDB();

  const resolvedApp = await startApp({ db });

  app = resolvedApp.app;

  await db.dropDatabase();
});

afterAll(async () => {
  await db.close();
});

describe('GET /posts/feed', () => {
  it('Should return status 403 and a message for not signed in user', async () => {
    const response = await request(app).get('/api/posts/feed');

    expect(response.status).toBe(401);
    expect(response.body.error).toMatchObject({
      message: 'Auth is required for this operation. Please sign in.',
    });
  });
});
