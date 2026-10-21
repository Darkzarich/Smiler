import request from 'supertest';
import { signUpRequest } from '@test-utils/request-auth';
import { insertThread } from '@test-utils/comment-thread';
import { COMMENT_MAX_BODY_LENGTH, COMMENT_MAX_DEPTH } from '@constants/index';
import { PostModel } from '@models/Post';
import { CommentModel } from '@models/Comment';
import { UserModel } from '@models/User';
import {
  generateRandomPost,
  generateRandomComment,
  generateRandomUser,
} from '@test-data-generators';
import { ERRORS } from '@errors';

describe('POST /comments', () => {
  it('Should return status 401 and an expected message if user is not signed in', async () => {
    const response = await request(global.app).post('/api/comments');

    expect(response.body.error.message).toBe(ERRORS.UNAUTHORIZED);
    expect(response.status).toBe(401);
  });

  it("Should return status 422 and an expected message if comment's body is empty", async () => {
    const { sessionCookie, csrfToken } = await signUpRequest(global.app);

    const post = await PostModel.create(generateRandomPost());

    const response = await request(global.app)
      .post('/api/comments')
      .send({
        post: post.id,
      })
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    expect(response.body.error.message).toBe(
      ERRORS.COMMENT_SHOULD_NOT_BE_EMPTY,
    );
    expect(response.status).toBe(422);
  });

  it("Should return status 422 and an expected message if comment's body exceeds max length", async () => {
    const { sessionCookie, csrfToken } = await signUpRequest(global.app);

    const post = await PostModel.create(generateRandomPost());

    const response = await request(global.app)
      .post('/api/comments')
      .send({
        body: 'a'.repeat(COMMENT_MAX_BODY_LENGTH + 1),
        post: post.id,
      })
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    expect(response.body.error.message).toBe(
      ERRORS.COMMENT_BODY_MAX_LENGTH_EXCEEDED,
    );
    expect(response.status).toBe(422);
  });

  it('Should return status 422 and an expected message if no post id was provided', async () => {
    const { sessionCookie, csrfToken } = await signUpRequest(global.app);

    const response = await request(global.app)
      .post('/api/comments')
      .send({ body: 'test' })
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    expect(response.body.error.message).toBe(ERRORS.POST_ID_REQUIRED);
    expect(response.status).toBe(422);
  });

  it('Should return status 200, create a comment and return it (without a parent)', async () => {
    const { sessionCookie, csrfToken, currentUser } = await signUpRequest(
      global.app,
    );

    const post = await PostModel.create(generateRandomPost());

    const response = await request(global.app)
      .post('/api/comments')
      .send({
        body: 'test',
        post: post.id,
      })
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      _id: expect.any(String),
      post: post.id,
      body: 'test',
      author: {
        _id: currentUser._id,
        login: currentUser.login,
        avatar: currentUser.avatar,
      },
      children: [],
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      rating: 0,
    });
  });

  it('Should sanitize html from the body', async () => {
    const { sessionCookie, csrfToken } = await signUpRequest(global.app);

    const post = await PostModel.create(generateRandomPost());

    const response = await request(global.app)
      .post('/api/comments')
      .send({
        body: '<script>alert("test")</script> test',
        post: post.id,
      })
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    expect(response.status).toBe(200);
    expect(response.body.body).toBe(' test');
  });

  it('Should force a hardened rel on links in the body', async () => {
    const { sessionCookie, csrfToken } = await signUpRequest(global.app);

    const post = await PostModel.create(generateRandomPost());

    const response = await request(global.app)
      .post('/api/comments')
      .send({
        body: '<a href="https://example.com" target="_blank" rel="dofollow">link</a>',
        post: post.id,
      })
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    expect(response.status).toBe(200);
    expect(response.body.body).toBe(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer nofollow ugc">link</a>',
    );
  });

  it('Should return status 404 and an expected message if parent comment was provided but not found', async () => {
    const { sessionCookie, csrfToken } = await signUpRequest(global.app);

    const post = await PostModel.create(generateRandomPost());

    const response = await request(global.app)
      .post('/api/comments')
      .send({
        body: 'test',
        post: post.id,
        parent: '5f8d9f4d2d4c2c001d0e1e2e',
      })
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    expect(response.body.error.message).toBe(
      ERRORS.COMMENT_PARENT_COMMENT_NOT_FOUND,
    );
    expect(response.status).toBe(404);
  });

  it('Should return status 404 and an expected message if post was provided but not found', async () => {
    const { sessionCookie, csrfToken } = await signUpRequest(global.app);

    const response = await request(global.app)
      .post('/api/comments')
      .send({
        body: 'test',
        post: '5f8d9f4d2d4c2c001d0e1e2e',
      })
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    expect(response.body.error.message).toBe(ERRORS.POST_NOT_FOUND);
    expect(response.status).toBe(404);
  });

  it('Should return status 200, create a comment and return it (with a parent)', async () => {
    const { sessionCookie, csrfToken, currentUser } = await signUpRequest(
      global.app,
    );

    const post = await PostModel.create(generateRandomPost());

    const parentComment = await CommentModel.create(
      generateRandomComment({
        author: currentUser._id,
        post: post.id,
      }),
    );

    const response = await request(global.app)
      .post('/api/comments')
      .send({
        body: 'test',
        post: post.id,
        parent: parentComment.id,
      })
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      _id: expect.any(String),
      parent: parentComment._id.toString(),
      post: post.id,
      body: 'test',
      author: {
        _id: currentUser._id,
        login: currentUser.login,
        avatar: currentUser.avatar,
      },
      children: [],
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      rating: 0,
    });
  });

  it("Should add children comment to parent's children array", async () => {
    const { sessionCookie, csrfToken, currentUser } = await signUpRequest(
      global.app,
    );

    const post = await PostModel.create(generateRandomPost());

    const parentComment = await CommentModel.create(
      generateRandomComment({
        author: currentUser._id,
        post: post.id,
      }),
    );

    const newComment = await request(global.app)
      .post('/api/comments')
      .send({
        body: 'test',
        post: post.id,
        parent: parentComment.id,
      })
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    const updatedParentComment = await CommentModel.findById(
      parentComment.id,
    ).lean();

    expect(
      updatedParentComment!.children.map((comment) => comment.toString()),
    ).toEqual([newComment.body._id]);
  });

  it('Should increase post comment count (after a comment without a parent)', async () => {
    const { sessionCookie, csrfToken } = await signUpRequest(global.app);

    const post = await PostModel.create(generateRandomPost());

    await request(global.app)
      .post('/api/comments')
      .send({
        body: 'test',
        post: post.id,
      })
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    const updatedPost = await PostModel.findById(post.id).lean();

    expect(updatedPost!.commentCount).toBe(post.commentCount + 1);
  });

  it('Should increase post comment count (after a comment with a parent)', async () => {
    const { sessionCookie, csrfToken, currentUser } = await signUpRequest(
      global.app,
    );

    const post = await PostModel.create(generateRandomPost());

    const parentComment = await CommentModel.create(
      generateRandomComment({
        author: currentUser._id,
        post: post.id,
      }),
    );

    await request(global.app)
      .post('/api/comments')
      .send({
        body: 'test',
        post: post.id,
        parent: parentComment.id,
      })
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    const updatedPost = await PostModel.findById(post.id).lean();

    expect(updatedPost!.commentCount).toBe(post.commentCount + 1);
  });

  describe('Depth limit', () => {
    async function reply({
      depth,
      repliedTo,
    }: {
      depth: number;
      repliedTo: number;
    }) {
      const { sessionCookie, csrfToken } = await signUpRequest(global.app);

      const post = await PostModel.create(generateRandomPost());

      const author = await UserModel.create(generateRandomUser());

      const ids = await insertThread({
        post: post._id,
        author: author._id,
        depth,
      });

      const response = await request(global.app)
        .post('/api/comments')
        .send({
          body: 'test',
          post: post.id,
          parent: ids[repliedTo - 1],
        })
        .set('Cookie', sessionCookie)
        .set('X-CSRF-Token', csrfToken);

      return { response, ids, author };
    }

    it(`Should nest a reply to a comment at depth ${COMMENT_MAX_DEPTH - 1} under it`, async () => {
      const { response, ids } = await reply({
        depth: COMMENT_MAX_DEPTH - 1,
        repliedTo: COMMENT_MAX_DEPTH - 1,
      });

      expect(response.status).toBe(200);
      expect(response.body.parent).toBe(ids.at(-1)!.toString());
      expect(response.body.replyTo).toBeUndefined();
    });

    it(`Should store a reply to a comment at depth ${COMMENT_MAX_DEPTH} next to it, naming the comment answered`, async () => {
      const { response, ids, author } = await reply({
        depth: COMMENT_MAX_DEPTH,
        repliedTo: COMMENT_MAX_DEPTH,
      });

      const [stored, newParent, repliedTo] = await Promise.all([
        CommentModel.findById(response.body._id).lean(),
        CommentModel.findById(ids[COMMENT_MAX_DEPTH - 2]).lean(),
        CommentModel.findById(ids[COMMENT_MAX_DEPTH - 1]).lean(),
      ]);

      expect(response.status).toBe(200);
      expect(response.body.parent).toBe(ids[COMMENT_MAX_DEPTH - 2].toString());
      expect(response.body.replyTo).toEqual({
        _id: ids[COMMENT_MAX_DEPTH - 1].toString(),
        login: author.login,
      });
      expect(stored!.replyTo).toEqual(ids[COMMENT_MAX_DEPTH - 1]);
      expect(newParent!.children).toContainEqual(stored!._id);
      expect(repliedTo!.children).toEqual([]);
    });

    it('Should store a reply to a comment already deeper than the limit at the limit', async () => {
      const { response, ids } = await reply({
        depth: COMMENT_MAX_DEPTH + 3,
        repliedTo: COMMENT_MAX_DEPTH + 3,
      });

      expect(response.status).toBe(200);
      expect(response.body.parent).toBe(ids[COMMENT_MAX_DEPTH - 2].toString());
      expect(response.body.replyTo._id).toBe(ids.at(-1)!.toString());
    });

    it('Should return status 404 if the comment replied to is on another post', async () => {
      const { sessionCookie, csrfToken } = await signUpRequest(global.app);

      const [post, otherPost] = await PostModel.create([
        generateRandomPost(),
        generateRandomPost(),
      ]);

      const comment = await CommentModel.create(
        generateRandomComment({ post: otherPost.id }),
      );

      const response = await request(global.app)
        .post('/api/comments')
        .send({ body: 'test', post: post.id, parent: comment.id })
        .set('Cookie', sessionCookie)
        .set('X-CSRF-Token', csrfToken);

      expect(response.body.error.message).toBe(
        ERRORS.COMMENT_PARENT_COMMENT_NOT_FOUND,
      );
      expect(response.status).toBe(404);
    });
  });
});
