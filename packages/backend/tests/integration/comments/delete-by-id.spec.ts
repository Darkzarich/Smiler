import request from 'supertest';
import { COMMENT_TIME_TO_UPDATE } from '@constants/index';
import { signUpRequest } from '@test-utils/request-auth';
import { PostModel } from '@models/Post';
import { CommentModel } from '@models/Comment';
import {
  generateRandomPost,
  generateRandomComment,
} from '@test-data-generators';
import { ERRORS } from '@errors';
import { Types } from 'mongoose';
import { subMinutes } from 'date-fns';

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

    const comment = await CommentModel.create(
      generateRandomComment({
        author: new Types.ObjectId('5d5467b4c17806706f3df347'),
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

    const comment = await CommentModel.create(
      generateRandomComment({
        author: currentUser.id,
        createdAt: subMinutes(Date.now(), COMMENT_TIME_TO_UPDATE - 1),
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

    const comment = await CommentModel.create(
      generateRandomComment({
        author: currentUser.id,
        // random id
        children: [new Types.ObjectId('5d5467b4c17806706f3df347')],
      }),
    );

    const response = await request(global.app)
      .delete(`/api/comments/${comment.id}`)
      .set('Cookie', sessionCookie);

    const updatedComment = await CommentModel.findById(comment.id).lean();

    expect(updatedComment!.deleted).toBe(true);
    expect(response.status).toBe(200);
  });

  it('Should remove comment from the database if it had no replies before being deleted', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const comment = await CommentModel.create(
      generateRandomComment({
        author: currentUser.id,
      }),
    );

    const response = await request(global.app)
      .delete(`/api/comments/${comment.id}`)
      .set('Cookie', sessionCookie);

    const updatedComment = await CommentModel.findById(comment.id).lean();

    expect(updatedComment).toBe(null);
    expect(response.status).toBe(200);
  });

  it("Should remove comment from parent's children if it had a parent and no replies before being deleted", async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const parentComment = await CommentModel.create(
      generateRandomComment({
        author: currentUser.id,
      }),
    );

    const comment = await CommentModel.create(
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

    const updatedParentComment = await CommentModel.findById(
      parentComment.id,
    ).lean();

    expect(updatedParentComment!.children).toEqual([]);
    expect(response.status).toBe(200);
  });

  it('Should decrease post comments count if a comment of the post was deleted', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const post = await PostModel.create(generateRandomPost());

    const comment = await CommentModel.create(
      generateRandomComment({
        author: currentUser.id,
        post: post.id,
      }),
    );

    await request(global.app)
      .delete(`/api/comments/${comment.id}`)
      .set('Cookie', sessionCookie);

    const updatedPost = await PostModel.findById(post.id).lean();

    expect(updatedPost!.commentCount).toBe(post.commentCount - 1);
  });
});
