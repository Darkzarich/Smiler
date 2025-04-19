import request from 'supertest';
import { removeFileByPath } from '@utils/remove-file-by-path';
import { COMMENT_TIME_TO_UPDATE } from '@constants/index';
import { signUpRequest } from '@test-utils/request-auth';
import { PostModel, POST_SECTION_TYPES } from '@models/Post';
import { generateRandomPost } from '@test-data-generators';
import { ERRORS } from '@errors';

describe('DELETE /posts/:id', () => {
  const mockRemoveFileByPath = jest.mocked(removeFileByPath);

  beforeEach(() => {
    mockRemoveFileByPath.mockClear();
  });

  it('Should return status 401 and an expected message if user is not signed in', async () => {
    const response = await request(global.app).delete('/api/posts/1234');

    expect(response.body.error.message).toBe(ERRORS.UNAUTHORIZED);
    expect(response.status).toBe(401);
  });

  it('Should return status 404 and an expected message if post was not found', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .delete('/api/posts/5d5467b4c17806706f3df347')
      .set('Cookie', sessionCookie);

    expect(response.body.error.message).toBe(ERRORS.POST_NOT_FOUND);
    expect(response.status).toBe(404);
  });

  it('Should return status 403 and an expected message if post does not belong to the user', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const post = await PostModel.create(
      generateRandomPost({
        author: '5d5467b4c17806706f3df347',
      }),
    );

    const response = await request(global.app)
      .delete(`/api/posts/${post.id}`)
      .set('Cookie', sessionCookie);

    expect(response.body.error.message).toBe(
      ERRORS.POST_CANT_DELETE_NOT_OWN_POST,
    );
    expect(response.status).toBe(403);
  });

  it('Should return status 403 and an expected message if post is older than 10 min', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const post = await PostModel.create(
      generateRandomPost({
        author: currentUser.id,
        createdAt: Date.now() - COMMENT_TIME_TO_UPDATE - 1,
      }),
    );

    const response = await request(global.app)
      .delete(`/api/posts/${post.id}`)
      .set('Cookie', sessionCookie);

    expect(response.body.error.message).toBe(
      ERRORS.POST_CAN_DELETE_WITHIN_TIME,
    );
    expect(response.status).toBe(403);
  });

  it('Should return status 403 and an expected message if post has comments', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const post = await PostModel.create(
      generateRandomPost({
        author: currentUser.id,
        commentCount: 1,
      }),
    );

    const response = await request(global.app)
      .delete(`/api/posts/${post.id}`)
      .set('Cookie', sessionCookie);

    expect(response.body.error.message).toBe(
      ERRORS.POST_CANT_DELETE_WITH_COMMENTS,
    );
    expect(response.status).toBe(403);
  });

  it('Should remove the post from the database', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const post = await PostModel.create(
      generateRandomPost({
        author: currentUser.id,
      }),
    );

    const response = await request(global.app)
      .delete(`/api/posts/${post.id}`)
      .set('Cookie', sessionCookie);

    const updatedPost = await PostModel.findById(post.id).lean();

    expect(updatedPost).toBe(null);
    expect(response.status).toBe(200);
  });

  it('Should delete picture files corresponding to the deleted post picture sections with isFile=true', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const post = await PostModel.create(
      generateRandomPost({
        author: currentUser.id,
        sections: [
          {
            type: POST_SECTION_TYPES.PICTURE,
            isFile: true,
            url: '/uploads/test/1724110246594.jpg',
          },
          {
            type: POST_SECTION_TYPES.PICTURE,
            isFile: true,
            url: '/uploads/test/1724110246595.jpg',
          },
        ],
      }),
    );

    await request(global.app)
      .delete(`/api/posts/${post.id}`)
      .set('Cookie', sessionCookie);

    expect(mockRemoveFileByPath.mock.calls[0][0]).toBe(
      '/uploads/test/1724110246594.jpg',
    );
    expect(mockRemoveFileByPath.mock.calls[1][0]).toBe(
      '/uploads/test/1724110246595.jpg',
    );
  });
});
