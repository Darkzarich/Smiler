import request from 'supertest';
import Rate from '../../../models/Rate.js';
import App from '../../../app.js';
import { connectDB } from '../../../libs/db.js';
import Post from '../../../models/Post.js';
import User from '../../../models/User.js';
import {
  generateRandomPost,
  generateRandomUser,
  generateRate,
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

describe('GET /posts/:slug', () => {
  it('Should return status 404 and a message for non-existing slug', async () => {
    const response = await request(app).get('/api/posts/non-existing-slug');

    expect(response.body.error.message).toBe("Post doesn't exist");
    expect(response.status).toBe(404);
  });

  it('Should return status 200 and a post with its author if a post by provided slug exists', async () => {
    const user = await User.create(generateRandomUser());

    const post = (
      await Post.create(
        generateRandomPost({
          author: user._id,
        }),
      )
    ).toJSON();

    const response = await request(app).get(`/api/posts/${post.slug}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      title: post.title,
      slug: post.slug,
      author: {
        id: user._id.toString(),
        login: user.login,
        avatar: user.avatar,
      },
      sections: post.sections,
      commentCount: 0,
      rating: 0,
      tags: post.tags,
      rated: { isRated: false, negative: false },
      createdAt: post.createdAt.toISOString(),
    });
  });

  it('Should return that a post is rated if the current user has rated it', async () => {
    // TODO: Move to test utils
    const currentUser = await request(app).post('/api/auth/signup').send({
      login: 'currentUser',
      email: 'current-user@gmail.com',
      password: '123456',
      confirm: '123456',
    });

    const sessionCookie = currentUser.headers['set-cookie'][0];

    const otherUser = await User.create(generateRandomUser());

    const post = await Post.create(
      generateRandomPost({
        author: otherUser._id,
      }),
    );

    const rate = await Rate.create(
      generateRate({
        target: post._id,
        negative: true,
      }),
    );

    await User.findByIdAndUpdate(currentUser.body.id, {
      $push: { rates: rate },
    });

    const response = await request(app)
      .get(`/api/posts/${post.slug}`)
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      rated: { isRated: true, negative: true },
    });
  });
});
