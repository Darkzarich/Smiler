import request from 'supertest';
import { Types } from 'mongoose';
import { signUpRequest } from '@test-utils/request-auth';
import { insertThread } from '@test-utils/comment-thread';
import { PostModel } from '@models/Post';
import { CommentModel } from '@models/Comment';
import {
  generateRandomPost,
  generateRandomComment,
  generateRandomUser,
  generateRate,
} from '@test-data-generators';
import { ERRORS } from '@errors';
import { COMMENT_MAX_DEPTH, COMMENT_MAX_LIMIT } from '@constants/index';
import { RateModel, RateTargetModel } from '@models/Rate';
import { UserModel } from '@models/User';

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
    const { sessionCookie, csrfToken } = await signUpRequest(global.app);

    const post = await PostModel.create(generateRandomPost());

    const response = await request(global.app)
      .get(`/api/comments?post=${post.id}`)
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      comments: [],
      hasNextPage: false,
    });
  });

  it('Should return more than one page in pagination if there are more than limit posts existing', async () => {
    const post = await PostModel.create(generateRandomPost());

    const comments = Array(11)
      .fill({})
      .map(() =>
        generateRandomComment({
          post: post.id,
        }),
      );

    await CommentModel.insertMany(comments);

    const response = await request(global.app).get(
      `/api/comments?post=${post.id}&limit=10`,
    );

    expect(response.status).toBe(200);
    expect(response.body.comments).toHaveLength(10);
    expect(response.body).toMatchObject({
      hasNextPage: true,
    });
  });

  it('Should correctly offset pagination', async () => {
    const post = await PostModel.create(generateRandomPost());

    const comments = Array(11)
      .fill({})
      .map(() =>
        generateRandomComment({
          post: post.id,
        }),
      );

    await CommentModel.insertMany(comments);

    const response = await request(global.app).get(
      `/api/comments?post=${post.id}&limit=10&offset=10`,
    );

    expect(response.status).toBe(200);
    expect(response.body.comments).toHaveLength(1);
    expect(response.body).toMatchObject({
      hasNextPage: false,
    });
  });

  it('Should filter comments by provided author if it was provided', async () => {
    const post = await PostModel.create(generateRandomPost());

    const [otherUser1, otherUser2] = await Promise.all([
      UserModel.create(generateRandomUser()),
      UserModel.create(generateRandomUser({ email: 'test2@gmail.com' })),
    ]);

    await Promise.all([
      CommentModel.create(
        generateRandomComment({
          post: post.id,
          author: otherUser1.id,
        }),
      ),
      CommentModel.create(
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
    const { sessionCookie, csrfToken, currentUser } = await signUpRequest(
      global.app,
    );

    const post = await PostModel.create(generateRandomPost());

    const comment = await CommentModel.create(
      generateRandomComment({
        author: currentUser._id,
        post: post.id,
      }),
    );

    const response = await request(global.app)
      .get(`/api/comments?post=${post.id}`)
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      comments: [
        {
          _id: comment._id.toString(),
          body: comment.body,
          author: {
            _id: currentUser._id,
            login: currentUser.login,
            avatar: currentUser.avatar,
          },
          children: [],
          deleted: false,
          createdAt: comment.createdAt.toISOString(),
          rating: comment.rating,
          rated: { isRated: false },
        },
      ],
      hasNextPage: false,
    });
  });

  it('Should return a comment with expected structure with its children (comment tree)', async () => {
    const { sessionCookie, csrfToken, currentUser } = await signUpRequest(
      global.app,
    );

    const post = await PostModel.create(generateRandomPost());

    const comment = await CommentModel.create(
      generateRandomComment({
        author: currentUser._id,
        post: post.id,
      }),
    );

    const childComment = await CommentModel.create(
      generateRandomComment({
        author: currentUser._id,
        post: post.id,
        parent: comment._id,
      }),
    );

    const childOfChildComment = await CommentModel.create(
      generateRandomComment({
        author: currentUser._id,
        post: post.id,
        parent: childComment._id,
      }),
    );

    const response = await request(global.app)
      .get(`/api/comments?post=${post.id}`)
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      comments: [
        {
          _id: comment._id.toString(),
          body: comment.body,
          author: {
            _id: currentUser._id,
            login: currentUser.login,
            avatar: currentUser.avatar,
          },
          children: [
            {
              _id: childComment._id.toString(),
              body: childComment.body,
              parent: comment._id.toString(),
              author: {
                _id: currentUser._id,
                login: currentUser.login,
                avatar: currentUser.avatar,
              },
              children: [
                {
                  _id: childOfChildComment._id.toString(),
                  body: childOfChildComment.body,
                  parent: childComment._id.toString(),
                  author: {
                    _id: currentUser._id,
                    login: currentUser.login,
                    avatar: currentUser.avatar,
                  },
                  children: [],
                  deleted: false,
                  createdAt: childOfChildComment.createdAt.toISOString(),
                  rating: childOfChildComment.rating,
                  rated: { isRated: false },
                },
              ],
              deleted: false,
              createdAt: childComment.createdAt.toISOString(),
              rating: childComment.rating,
              rated: { isRated: false },
            },
          ],
          deleted: false,
          createdAt: comment.createdAt.toISOString(),
          rating: comment.rating,
          rated: { isRated: false },
        },
      ],
      hasNextPage: false,
    });
  });

  it('Should return every reply of a thread 25 levels deep, with its author and vote', async () => {
    const { sessionCookie, csrfToken, currentUser } = await signUpRequest(
      global.app,
    );

    const post = await PostModel.create(generateRandomPost());

    const author = await UserModel.create(generateRandomUser());

    const ids = Array.from({ length: 25 }, () => new Types.ObjectId());

    await CommentModel.insertMany(
      ids.map((_id, level) => ({
        ...generateRandomComment({
          author: author._id,
          post: post.id,
          body: `level ${level + 1}`,
          parent: ids[level - 1],
        }),
        _id,
      })),
    );

    await RateModel.create(
      generateRate({
        user: currentUser._id,
        target: ids.at(-1),
        negative: false,
        targetModel: RateTargetModel.COMMENT,
      }),
    );

    const response = await request(global.app)
      .get(`/api/comments?post=${post.id}`)
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    expect(response.status).toBe(200);

    const levels = [];

    let [node] = response.body.comments;

    while (node) {
      levels.push(node);
      [node] = node.children;
    }

    expect(levels.map((level) => level.body)).toEqual(
      ids.map((_id, level) => `level ${level + 1}`),
    );
    expect(levels.every((level) => level.author?.login === author.login)).toBe(
      true,
    );
    expect(levels.at(-1).rated).toEqual({ isRated: true, negative: false });
  });

  it(`Should list a reply to a comment at depth ${COMMENT_MAX_DEPTH} next to it, with the login it answers`, async () => {
    const { sessionCookie, csrfToken } = await signUpRequest(global.app);

    const post = await PostModel.create(generateRandomPost());

    const author = await UserModel.create(generateRandomUser());

    const ids = await insertThread({
      post: post._id,
      author: author._id,
      depth: COMMENT_MAX_DEPTH,
    });

    const { body: reply } = await request(global.app)
      .post('/api/comments')
      .send({ body: 'test', post: post.id, parent: ids.at(-1) })
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    const response = await request(global.app).get(
      `/api/comments?post=${post.id}`,
    );

    let [node] = response.body.comments;

    for (let depth = 1; depth < COMMENT_MAX_DEPTH - 1; depth += 1) {
      [node] = node.children;
    }

    expect(response.status).toBe(200);
    expect(
      node.children.map(
        (child: { _id: string; replyTo?: unknown; children: unknown[] }) => [
          child._id,
          child.replyTo,
          child.children,
        ],
      ),
    ).toEqual([
      [ids.at(-1)!.toString(), undefined, []],
      [reply._id, { _id: ids.at(-1)!.toString(), login: author.login }, []],
    ]);
  });

  it('Should list a reply to a deleted comment with no login to show', async () => {
    const post = await PostModel.create(generateRandomPost());

    const [comment, repliedTo] = await CommentModel.create([
      generateRandomComment({ post: post.id }),
      generateRandomComment({ post: post.id, deleted: true }),
    ]);

    await CommentModel.insertMany([
      generateRandomComment({
        post: post.id,
        parent: comment._id,
        replyTo: repliedTo._id,
      }),
    ]);

    const response = await request(global.app).get(
      `/api/comments?post=${post.id}`,
    );

    const listed = response.body.comments.find(
      (root: { _id: string }) => root._id === comment.id,
    );

    expect(listed.children[0].replyTo).toEqual({
      _id: repliedTo.id,
      login: null,
    });
  });

  it('Should list the replies to a comment oldest first', async () => {
    const post = await PostModel.create(generateRandomPost());

    const comment = await CommentModel.create(
      generateRandomComment({ post: post.id }),
    );

    const replies = await CommentModel.insertMany(
      [3, 2, 1].map((minutesAgo) =>
        generateRandomComment({
          post: post.id,
          parent: comment._id,
          createdAt: new Date(Date.now() - minutesAgo * 60_000),
        }),
      ),
    );

    const response = await request(global.app).get(
      `/api/comments?post=${post.id}`,
    );

    expect(response.status).toBe(200);
    expect(
      response.body.comments[0].children.map(
        (reply: { _id: string }) => reply._id,
      ),
    ).toEqual(replies.map((reply) => reply._id.toString()));
  });

  it('Should sort comments by rating descending', async () => {
    const post = await PostModel.create(generateRandomPost());

    await Promise.all([
      CommentModel.create(
        generateRandomComment({
          post: post.id,
          rating: 5,
        }),
      ),
      CommentModel.create(
        generateRandomComment({
          post: post.id,
          rating: 10,
        }),
      ),
    ]);

    await CommentModel.create(
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
    const { sessionCookie, csrfToken, currentUser } = await signUpRequest(
      global.app,
    );

    const post = await PostModel.create(generateRandomPost());

    const otherUser = await UserModel.create(generateRandomUser());

    const otherUserComment = await CommentModel.create(
      generateRandomComment({
        author: otherUser.id,
        post: post.id,
      }),
    );

    await RateModel.create(
      generateRate({
        user: currentUser._id,
        target: otherUserComment._id,
        negative: true,
        targetModel: RateTargetModel.COMMENT,
      }),
    );
    const response = await request(global.app)
      .get(`/api/comments?post=${post.id}`)
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    expect(response.status).toBe(200);
    expect(response.body.comments[0]).toMatchObject({
      rated: {
        isRated: true,
        negative: true,
      },
    });
  });
});
