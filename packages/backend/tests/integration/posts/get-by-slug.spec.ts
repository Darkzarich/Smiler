import request from 'supertest';
import { RateModel } from '@models/Rate';
import { PostModel } from '@models/Post';
import { UserModel } from '@models/User';
import {
  generateRandomPost,
  generateRandomUser,
  generateRate,
} from '@test-data-generators';
import { signUpRequest } from '@test-utils/request-auth';
import { ERRORS } from '@errors';

describe('GET /posts/:slug', () => {
  it('Should return status 404 and a message for non-existing slug', async () => {
    const response = await request(global.app).get(
      '/api/posts/non-existing-slug',
    );

    expect(response.body.error.message).toBe(ERRORS.POST_NOT_FOUND);
    expect(response.status).toBe(404);
  });

  it('Should return a post with its author if a post by provided slug exists with an expected structure', async () => {
    const user = await UserModel.create(generateRandomUser());

    const post = (
      await PostModel.create(
        generateRandomPost({
          author: user._id,
        }),
      )
    ).toJSON();

    const response = await request(global.app).get(`/api/posts/${post.slug}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: post._id.toString(),
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
    const { currentUser, sessionCookie } = await signUpRequest(global.app);

    const otherUser = await UserModel.create(generateRandomUser());

    const post = await PostModel.create(
      generateRandomPost({
        author: otherUser._id,
      }),
    );

    const rate = await RateModel.create(
      generateRate({
        target: post._id,
        negative: true,
      }),
    );

    await UserModel.findByIdAndUpdate(currentUser.id, {
      $push: { rates: rate },
    });

    const response = await request(global.app)
      .get(`/api/posts/${post.slug}`)
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body.rated).toMatchObject({
      isRated: true,
      negative: true,
    });
  });
});
