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

describe('GET /posts?author=', () => {
  it('Should return status 422 and an expected error message for limit > 100', async () => {
    const response = await request(app).get(
      '/api/posts?author=some-author&limit=101',
    );

    expect(response.status).toBe(422);
    expect(response.body.error).toMatchObject({
      message: "Limit can't be more than 100",
    });
  });

  it("Should return status 404 and an expected error message if author doesn't exist", async () => {
    const response = await request(app).get(
      '/api/posts?author=not-existing-author',
    );

    expect(response.status).toBe(404);
    expect(response.body.error).toMatchObject({
      message: "Author doesn't exist",
    });
  });
});
