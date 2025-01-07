import request from 'supertest';
import { COMMENT_TIME_TO_UPDATE } from '../../../constants/index.js';
import { signUpRequest } from '../../utils/request-auth.js';
import Comment from '../../../models/Comment.js';
import User from '../../../models/User.js';
import {
  generateRandomComment,
  generateRandomUser,
} from '../../data-generators/index.js';
import { ERRORS } from '../../../errors/index.js';

describe('PUT /comments/:id', () => {
  it('Should return status 401 and an expected message if user is not signed in', async () => {
    const response = await request(global.app).put('/api/comments/1234');

    expect(response.body.error.message).toBe(ERRORS.UNAUTHORIZED);
    expect(response.status).toBe(401);
  });

  it('Should return status 404 and an expected message if comment was not found', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .put('/api/comments/5d5467b4c17806706f3df347')
      .set('Cookie', sessionCookie);

    expect(response.body.error.message).toBe(ERRORS.COMMENT_NOT_FOUND);
    expect(response.status).toBe(404);
  });

  it('Should return status 403 and an expected message if comment does not belong to the user', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const otherUser = await User.create(generateRandomUser());

    const comment = await Comment.create(
      generateRandomComment({
        author: otherUser.id,
      }),
    );

    const response = await request(global.app)
      .put(`/api/comments/${comment.id}`)
      .set('Cookie', sessionCookie);

    expect(response.body.error.message).toBe(ERRORS.COMMENT_CANT_EDIT_NOT_OWN);
    expect(response.status).toBe(403);
  });

  it('Should return status 403 and an expected message if comment is older than 10 min', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const comment = await Comment.create(
      generateRandomComment({
        author: currentUser.id,
        createdAt: Date.now() - COMMENT_TIME_TO_UPDATE - 1,
      }),
    );

    const response = await request(global.app)
      .put(`/api/comments/${comment.id}`)
      .set('Cookie', sessionCookie);

    expect(response.body.error.message).toBe(
      ERRORS.COMMENT_CAN_EDIT_WITHIN_TIME,
    );
    expect(response.status).toBe(403);
  });

  it("Should return status 200 and update the comment's body in the database", async () => {
    const body = 'test test test';

    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const comment = await Comment.create(
      generateRandomComment({
        author: currentUser.id,
      }),
    );

    const response = await request(global.app)
      .put(`/api/comments/${comment.id}`)
      .send({ body })
      .set('Cookie', sessionCookie);

    const updatedComment = await Comment.findById(comment.id).lean();

    expect(updatedComment.body).toBe(body);
    expect(response.status).toBe(200);
  });

  it('Should return status 200 and the updated comment', async () => {
    const body = 'test test test';

    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const comment = await Comment.create(
      generateRandomComment({
        author: currentUser.id,
      }),
    );

    const response = await request(global.app)
      .put(`/api/comments/${comment.id}`)
      .send({ body })
      .set('Cookie', sessionCookie);

    expect(response.body).toEqual({
      _id: comment.id,
      id: comment.id,
      body,
      author: {
        _id: currentUser.id,
        id: currentUser.id,
        avatar: currentUser.avatar,
        login: currentUser.login,
      },
      children: [],
      rating: comment.rating,
      post: comment.post.toString(),
      createdAt: comment.createdAt.toJSON(),
      deleted: false,
    });
    expect(response.status).toBe(200);
  });
});
