import request from 'supertest';
import App from '../../app.js';
import { connectDB } from '../../libs/db.js';

let app;
let db;

beforeAll(async () => {
  db = await connectDB();

  const resolvedApp = await App.startApp({ db });

  app = resolvedApp.app;

  await db.dropDatabase();
});

afterAll(async () => {
  await db.close();
});

describe('GET /posts?author=', () => {
  it('Should return status 422 and an expected error message for limit > 15', async () => {
    const response = await request(app).get(
      '/api/posts?author=some-author&limit=101',
    );

    expect(response.body.error.message).toBe("Limit can't be more than 15");
    expect(response.status).toBe(422);
  });

  it("Should return status 404 and an expected error message if author doesn't exist", async () => {
    const response = await request(app).get(
      '/api/posts?author=not-existing-author',
    );

    expect(response.body.error.message).toBe("Author doesn't exist");
    expect(response.status).toBe(404);
  });
});
