import request from 'supertest';
import {} from 'date-fns';
import { COMMENT_TIME_TO_UPDATE } from '../../../constants/index.js';
import { signUpRequest } from '../../utils/request-auth.js';
import Post from '../../../models/Post.js';
import Comment from '../../../models/Comment.js';
import {
  generateRandomPost,
  generateRandomComment,
} from '../../data-generators/index.js';
import { ERRORS } from '../../../errors/index.js';

describe('DELETE /comments/:id', () => {
  it('Should return status 401 and an expected message if user is not signed in', async () => {
    const response = await request(global.app).delete('/api/comments/1234');

    expect(response.body.error.message).toBe(ERRORS.UNAUTHORIZED);
    expect(response.status).toBe(401);
  });

  it('Should return status 404 and an expected message if comment was not found', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .delete('/api/comments/5d5467b4c17806706f3df347')
      .set('Cookie', sessionCookie);

    expect(response.body.error.message).toBe(ERRORS.COMMENT_NOT_FOUND);
    expect(response.status).toBe(404);
  });

  it('Should return status 403 and an expected message if comment does not belong to the user', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const comment = await Comment.create(
      generateRandomComment({
        author: '5d5467b4c17806706f3df347',
      }),
    );

    const response = await request(global.app)
      .delete(`/api/comments/${comment.id}`)
      .set('Cookie', sessionCookie);

    expect(response.body.error.message).toBe(
      ERRORS.COMMENT_CANT_DELETE_NOT_OWN,
    );
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
      .delete(`/api/comments/${comment.id}`)
      .set('Cookie', sessionCookie);

    expect(response.body.error.message).toBe(
      ERRORS.COMMENT_CAN_DELETE_WITHIN_TIME,
    );
    expect(response.status).toBe(403);
  });

  it('Should set "deleted" flag to true if comment had replies before being deleted', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const comment = await Comment.create(
      generateRandomComment({
        author: currentUser.id,
        // random id
        children: ['5d5467b4c17806706f3df347'],
      }),
    );

    const response = await request(global.app)
      .delete(`/api/comments/${comment.id}`)
      .set('Cookie', sessionCookie);

    const updatedComment = await Comment.findById(comment.id).lean();

    expect(updatedComment.deleted).toBe(true);
    expect(response.status).toBe(200);
  });

  it('Should remove comment from the database if it had no replies before being deleted', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const comment = await Comment.create(
      generateRandomComment({
        author: currentUser.id,
      }),
    );

    const response = await request(global.app)
      .delete(`/api/comments/${comment.id}`)
      .set('Cookie', sessionCookie);

    const updatedComment = await Comment.findById(comment.id).lean();

    expect(updatedComment).toBe(null);
    expect(response.status).toBe(200);
  });

  it("Should remove comment from parent's children if it had a parent and no replies before being deleted", async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const parentComment = await Comment.create(
      generateRandomComment({
        author: currentUser.id,
      }),
    );

    const comment = await Comment.create(
      generateRandomComment({
        author: currentUser.id,
        parent: parentComment.id,
      }),
    );

    parentComment.children.push(comment.id);
    await parentComment.save();

    const response = await request(global.app)
      .delete(`/api/comments/${comment.id}`)
      .set('Cookie', sessionCookie);

    const updatedParentComment = await Comment.findById(
      parentComment.id,
    ).lean();

    expect(updatedParentComment.children).toEqual([]);
    expect(response.status).toBe(200);
  });

  it('Should decrease post comments count if a comment of the post was deleted', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const post = await Post.create(generateRandomPost());

    const comment = await Comment.create(
      generateRandomComment({
        author: currentUser.id,
        post: post.id,
      }),
    );

    await request(global.app)
      .delete(`/api/comments/${comment.id}`)
      .set('Cookie', sessionCookie);

    const updatedPost = await Post.findById(post.id).lean();

    expect(updatedPost.commentCount).toBe(post.commentCount - 1);
  });
});
