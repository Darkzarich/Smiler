import request from 'supertest';
import { signUpRequest } from '../../utils/request-auth';
import { PostModel } from '../../../src/models/Post';
import { CommentModel } from '../../../src/models/Comment';
import {
  generateRandomPost,
  generateRandomComment,
} from '../../data-generators/index';
import { ERRORS } from '../../../src/errors';

describe('POST /comments', () => {
  it('Should return status 401 and an expected message if user is not signed in', async () => {
    const response = await request(global.app).post('/api/comments');

    expect(response.body.error.message).toBe(ERRORS.UNAUTHORIZED);
    expect(response.status).toBe(401);
  });

  it("Should return status 422 and an expected message if comment's body is empty", async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .post('/api/comments')
      .send({})
      .set('Cookie', sessionCookie);

    expect(response.body.error.message).toBe(
      ERRORS.COMMENT_SHOULD_NOT_BE_EMPTY,
    );
    expect(response.status).toBe(422);
  });

  it('Should return status 422 and an expected message if no post id was provided', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .post('/api/comments')
      .send({ body: 'test' })
      .set('Cookie', sessionCookie);

    expect(response.body.error.message).toBe(ERRORS.POST_ID_REQUIRED);
    expect(response.status).toBe(422);
  });

  it('Should return status 200, create a comment and return it (without a parent)', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const post = await PostModel.create(generateRandomPost());

    const response = await request(global.app)
      .post('/api/comments')
      .send({
        body: 'test',
        post: post.id,
      })
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      _id: expect.any(String),
      id: expect.any(String),
      post: post.id,
      body: 'test',
      author: {
        _id: currentUser.id,
        id: currentUser.id,
        login: currentUser.login,
        avatar: currentUser.avatar,
      },
      children: [],
      deleted: false,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      rating: 0,
    });
  });

  it('Should sanitize html from the body', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const post = await PostModel.create(generateRandomPost());

    const response = await request(global.app)
      .post('/api/comments')
      .send({
        body: '<script>alert("test")</script> test',
        post: post.id,
      })
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body.body).toBe(' test');
  });

  it('Should return status 404 and an expected message if parent comment was provided but not found', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const post = await PostModel.create(generateRandomPost());

    const response = await request(global.app)
      .post('/api/comments')
      .send({
        body: 'test',
        post: post.id,
        parent: '5f8d9f4d2d4c2c001d0e1e2e',
      })
      .set('Cookie', sessionCookie);

    expect(response.body.error.message).toBe(
      ERRORS.COMMENT_PARENT_COMMENT_NOT_FOUND,
    );
    expect(response.status).toBe(404);
  });

  it('Should return status 404 and an expected message if post was provided but not found', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .post('/api/comments')
      .send({
        body: 'test',
        post: '5f8d9f4d2d4c2c001d0e1e2e',
      })
      .set('Cookie', sessionCookie);

    expect(response.body.error.message).toBe(ERRORS.POST_NOT_FOUND);
    expect(response.status).toBe(404);
  });

  it('Should return status 200, create a comment and return it (with a parent)', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const post = await PostModel.create(generateRandomPost());

    const parentComment = await CommentModel.create(
      generateRandomComment({
        author: currentUser.id,
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
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      _id: expect.any(String),
      id: expect.any(String),
      parent: parentComment._id.toString(),
      post: post.id,
      body: 'test',
      author: {
        _id: currentUser.id,
        id: currentUser.id,
        login: currentUser.login,
        avatar: currentUser.avatar,
      },
      children: [],
      deleted: false,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      rating: 0,
    });
  });

  it("Should add children comment to parent's children array", async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const post = await PostModel.create(generateRandomPost());

    const parentComment = await CommentModel.create(
      generateRandomComment({
        author: currentUser.id,
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
      .set('Cookie', sessionCookie);

    const updatedParentComment = await CommentModel.findById(
      parentComment.id,
    ).lean();

    expect(
      updatedParentComment!.children.map((comment) => comment.toString()),
    ).toEqual([newComment.body.id]);
  });

  it('Should increase post comment count (after a comment without a parent)', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const post = await PostModel.create(generateRandomPost());

    await request(global.app)
      .post('/api/comments')
      .send({
        body: 'test',
        post: post.id,
      })
      .set('Cookie', sessionCookie);

    const updatedPost = await PostModel.findById(post.id).lean();

    expect(updatedPost!.commentCount).toBe(post.commentCount + 1);
  });

  it('Should increase post comment count (after a comment with a parent)', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const post = await PostModel.create(generateRandomPost());

    const parentComment = await CommentModel.create(
      generateRandomComment({
        author: currentUser.id,
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
      .set('Cookie', sessionCookie);

    const updatedPost = await PostModel.findById(post.id).lean();

    expect(updatedPost!.commentCount).toBe(post.commentCount + 1);
  });
});
