import request from 'supertest';
import { signUpRequest } from '../../utils/request-auth';
import Post from '../../../models/Post';
import Comment from '../../../models/Comment';
import {
  generateRandomPost,
  generateRandomComment,
  generateRandomUser,
  generateRate,
} from '../../data-generators/index';
import { ERRORS } from '../../../errors/index';
import { COMMENT_MAX_LIMIT } from '../../../constants/index';
import Rate from '../../../models/Rate';
import User from '../../../models/User';

describe('GET /comments', () => {
  it(`Should return status 422 and an expected message for limit greater than ${COMMENT_MAX_LIMIT}`, async () => {
    const response = await request(global.app).get(
      `/api/comments?limit=${COMMENT_MAX_LIMIT + 1}`,
    );

    expect(response.body.error.message).toBe(
      ERRORS.COMMENT_LIMIT_PARAM_EXCEEDED,
    );
    expect(response.status).toBe(422);
  });

  it('Should return status 422 and an expected message if post id is not provided', async () => {
    const response = await request(global.app).get('/api/comments');

    expect(response.body.error.message).toBe(ERRORS.POST_ID_REQUIRED);
    expect(response.status).toBe(422);
  });

  it('Should return status 404 and an expected message if provided author is not found', async () => {
    const response = await request(global.app).get(
      '/api/comments?post=5d5467b4c17806706f3df347&author=5d5467b4c17806706f3df348',
    );

    expect(response.body.error.message).toBe(ERRORS.AUTHOR_NOT_FOUND);
    expect(response.status).toBe(404);
  });

  it('Should return empty list of comments if there are no comments', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const post = await Post.create(generateRandomPost());

    const response = await request(global.app)
      .get(`/api/comments?post=${post.id}`)
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      comments: [],
      pages: 0,
      total: 0,
      hasNextPage: false,
    });
  });

  it('Should return more than one page in pagination if there are more than limit posts existing', async () => {
    const post = await Post.create(generateRandomPost());

    const comments = Array(11)
      .fill({})
      .map(() =>
        generateRandomComment({
          post: post.id,
        }),
      );

    await Comment.insertMany(comments);

    const response = await request(global.app).get(
      `/api/comments?post=${post.id}&limit=10`,
    );

    expect(response.status).toBe(200);
    expect(response.body.comments).toHaveLength(10);
    expect(response.body).toMatchObject({
      total: 11,
      pages: 2,
      hasNextPage: true,
    });
  });

  it('Should correctly offset pagination', async () => {
    const post = await Post.create(generateRandomPost());

    const comments = Array(11)
      .fill({})
      .map(() =>
        generateRandomComment({
          post: post.id,
        }),
      );

    await Comment.insertMany(comments);

    const response = await request(global.app).get(
      `/api/comments?post=${post.id}&limit=10&offset=10`,
    );

    expect(response.status).toBe(200);
    expect(response.body.comments).toHaveLength(1);
    expect(response.body).toMatchObject({
      total: 11,
      pages: 2,
      hasNextPage: false,
    });
  });

  it('Should filter comments by provided author if it was provided', async () => {
    const post = await Post.create(generateRandomPost());

    const [otherUser1, otherUser2] = await Promise.all([
      User.create(generateRandomUser()),
      User.create(generateRandomUser({ email: 'test2@gmail.com' })),
    ]);

    await Promise.all([
      Comment.create(
        generateRandomComment({
          post: post.id,
          author: otherUser1.id,
        }),
      ),
      Comment.create(
        generateRandomComment({
          post: post.id,
          author: otherUser2.id,
        }),
      ),
    ]);

    const response = await request(global.app).get(
      `/api/comments?post=${post.id}&author=${otherUser1._id}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.comments).toHaveLength(1);
    expect(response.body.comments[0].author._id).toBe(
      otherUser1._id.toString(),
    );
  });

  it('Should return a comment with an expected structure', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const post = await Post.create(generateRandomPost());

    const comment = await Comment.create(
      generateRandomComment({
        author: currentUser.id,
        post: post.id,
      }),
    );

    const response = await request(global.app)
      .get(`/api/comments?post=${post.id}`)
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      comments: [
        {
          id: comment._id.toString(),
          body: comment.body,
          author: {
            _id: currentUser.id,
            id: currentUser.id,
            login: currentUser.login,
            avatar: currentUser.avatar,
          },
          children: [],
          deleted: false,
          createdAt: comment.createdAt.toISOString(),
          rating: 0,
          rated: { isRated: false, negative: false },
        },
      ],
      pages: 1,
      total: 1,
      hasNextPage: false,
    });
  });

  it('Should return a comment with expected structure with its children (comment tree)', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const post = await Post.create(generateRandomPost());

    const comment = await Comment.create(
      generateRandomComment({
        author: currentUser.id,
        post: post.id,
      }),
    );

    const childComment = await Comment.create(
      generateRandomComment({
        author: currentUser.id,
        post: post.id,
        parent: comment._id,
      }),
    );

    const childOfChildComment = await Comment.create(
      generateRandomComment({
        author: currentUser.id,
        post: post.id,
        parent: childComment._id,
      }),
    );

    await Promise.all([
      Comment.updateOne(
        { _id: comment._id },
        { $push: { children: childComment._id } },
      ),
      Comment.updateOne(
        { _id: childComment._id },
        { $push: { children: childOfChildComment._id } },
      ),
    ]);

    const response = await request(global.app)
      .get(`/api/comments?post=${post.id}`)
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      comments: [
        {
          id: comment._id.toString(),
          body: comment.body,
          author: {
            _id: currentUser.id,
            id: currentUser.id,
            login: currentUser.login,
            avatar: currentUser.avatar,
          },
          children: [
            {
              id: childComment._id.toString(),
              body: childComment.body,
              parent: comment._id.toString(),
              author: {
                _id: currentUser.id,
                id: currentUser.id,
                login: currentUser.login,
                avatar: currentUser.avatar,
              },
              children: [
                {
                  id: childOfChildComment._id.toString(),
                  body: childOfChildComment.body,
                  parent: childComment._id.toString(),
                  author: {
                    _id: currentUser.id,
                    id: currentUser.id,
                    login: currentUser.login,
                    avatar: currentUser.avatar,
                  },
                  children: [],
                  deleted: false,
                  createdAt: childOfChildComment.createdAt.toISOString(),
                  rating: 0,
                  rated: { isRated: false, negative: false },
                },
              ],
              deleted: false,
              createdAt: childComment.createdAt.toISOString(),
              rating: 0,
              rated: { isRated: false, negative: false },
            },
          ],
          deleted: false,
          createdAt: comment.createdAt.toISOString(),
          rating: 0,
          rated: { isRated: false, negative: false },
        },
      ],
      pages: 1,
      total: 1,
      hasNextPage: false,
    });
  });

  it('Should sort comments by rating descending', async () => {
    const post = await Post.create(generateRandomPost());

    await Promise.all([
      Comment.create(
        generateRandomComment({
          post: post.id,
          rating: 5,
        }),
      ),
      Comment.create(
        generateRandomComment({
          post: post.id,
          rating: 10,
        }),
      ),
    ]);

    await Comment.create(
      generateRandomComment({
        post: post.id,
        rating: 15,
      }),
    );

    const response = await request(global.app).get(
      `/api/comments?post=${post.id}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.comments[0].rating).toBe(15);
    expect(response.body.comments[1].rating).toBe(10);
    expect(response.body.comments[2].rating).toBe(5);
  });

  it('Should return rated comment if the current user rated it', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const post = await Post.create(generateRandomPost());

    const otherUser = await User.create(generateRandomUser());

    const otherUserComment = await Comment.create(
      generateRandomComment({
        author: otherUser.id,
        post: post.id,
      }),
    );

    const rate = await Rate.create(
      generateRate({
        target: otherUserComment._id,
        negative: true,
        targetModel: 'Comment',
      }),
    );

    await User.findByIdAndUpdate(currentUser.id, {
      $push: { rates: rate._id },
    });

    const response = await request(global.app)
      .get(`/api/comments?post=${post.id}`)
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body.comments[0]).toMatchObject({
      rated: {
        isRated: true,
        negative: true,
      },
    });
  });
});
