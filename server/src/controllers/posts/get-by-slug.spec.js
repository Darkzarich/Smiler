import request from 'supertest';
import App from '../../app.js';
import { connectDB } from '../../libs/db.js';
import Post from '../../models/Post.js';
import User from '../../models/User.js';

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

describe('GET /posts/:slug', () => {
  it('Should return status 404 and a message for non-existing slug', async () => {
    const response = await request(app).get('/api/posts/non-existing-slug');

    expect(response.body.error.message).toBe("Post doesn't exist");
    expect(response.status).toBe(404);
  });

  // TODO: Temporary implementation
  it('Should return status 200 and a post with its author if a post by provided slug exists', async () => {
    const user = await User.create({
      login: 'test',
      email: 'test@gmail.com',
      password: 'test',
      salt: 'test',
      hash: 'test',
    });

    const post = await Post.create({
      title: 'My post title',
      slug: 'my-post-title-d2k5g8',
      author: user._id,
    });

    const response = await request(app).get(`/api/posts/${post.slug}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      title: post.title,
      slug: post.slug,
      author: {
        id: user._id.toString(),
        login: user.login,
        avatar: '',
      },
      sections: [],
      commentCount: 0,
      rating: 0,
      createdAt: expect.any(String),
      tags: [],
    });
  });
});
