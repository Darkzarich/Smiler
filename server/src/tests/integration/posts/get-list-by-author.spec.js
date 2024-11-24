import request from 'supertest';
import App from '../../../app.js';
import { connectDB } from '../../../libs/db.js';
import Post from '../../../models/Post.js';
import User from '../../../models/User.js';
import {
  generateRandomPost,
  generateRandomUser,
} from '../../data-generators/index.js';

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

  it("Should return empty list of posts if author doesn't have any posts", async () => {
    const otherUser = await User.create(generateRandomUser());

    const response = await request(app).get(
      `/api/posts?author=${otherUser.login}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      posts: [],
      total: 0,
      pages: 0,
      hasNextPage: false,
    });
  });

  it("Should a list of the author's posts with an expected structure", async () => {
    const otherUser = await User.create(generateRandomUser());

    const post = (
      await Post.create(
        generateRandomPost({
          author: otherUser._id,
        }),
      )
    ).toJSON();

    const response = await request(app).get(
      `/api/posts?author=${otherUser.login}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      posts: [
        {
          id: post._id.toString(),
          title: post.title,
          slug: post.slug,
          author: {
            id: otherUser._id.toString(),
            login: otherUser.login,
            avatar: otherUser.avatar,
          },
          sections: post.sections,
          commentCount: 0,
          rating: 0,
          tags: post.tags,
          rated: { isRated: false, negative: false },
          createdAt: post.createdAt.toISOString(),
        },
      ],
      total: 1,
      pages: 1,
      hasNextPage: false,
    });
  });
});
