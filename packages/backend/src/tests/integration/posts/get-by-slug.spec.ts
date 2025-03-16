import request from 'supertest';
import Rate from '../../../models/Rate';

import Post from '../../../models/Post';
import User from '../../../models/User';
import {
  generateRandomPost,
  generateRandomUser,
  generateRate,
} from '../../data-generators/index';
import { signUpRequest } from '../../utils/request-auth';
import { ERRORS } from '../../../errors/index';

describe('GET /posts/:slug', () => {
  it('Should return status 404 and a message for non-existing slug', async () => {
    const response = await request(global.app).get(
      '/api/posts/non-existing-slug',
    );

    expect(response.body.error.message).toBe(ERRORS.POST_NOT_FOUND);
    expect(response.status).toBe(404);
  });

  it('Should return a post with its author if a post by provided slug exists with an expected structure', async () => {
    const user = await User.create(generateRandomUser());

    const post = (
      await Post.create(
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

    await User.findByIdAndUpdate(currentUser.id, {
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
