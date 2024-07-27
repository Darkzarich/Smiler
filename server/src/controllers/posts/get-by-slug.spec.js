const mongoose = require('mongoose');
const request = require('supertest');

const connectDB = require('../../../db');
const main = require('../../../worker');

const app = main();

beforeAll(async () => {
  const db = await connectDB();
  await db.dropDatabase();
});

afterAll(async () => {
  await mongoose.connection.close();
  (await app).server.close();
});

describe('GET /posts/:slug', () => {
  it('Should return status 404 and a message for non-existing slug', async () => {
    const response = await request((await app).app).get(
      '/api/posts/non-existing-slug',
    );

    expect(response.status).toEqual(404);
    expect(response.body.error).toMatchObject({
      message: "Post doesn't exist",
    });
  });
});
