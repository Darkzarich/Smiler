const request = require('supertest');
const main = require('../../../worker');

let app;
let server;
let db;

beforeAll(async () => {
  const resolvedMain = await main();

  app = resolvedMain.app;
  server = resolvedMain.server;
  db = resolvedMain.db;

  await db.dropDatabase();
});

afterAll(async () => {
  await db.close();
  server.close();
});

describe('GET /posts/:slug', () => {
  it('Should return status 404 and a message for non-existing slug', async () => {
    const response = await request(app).get('/api/posts/non-existing-slug');

    expect(response.status).toEqual(404);
    expect(response.body.error).toMatchObject({
      message: "Post doesn't exist",
    });
  });
});
