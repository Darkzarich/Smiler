import request from 'supertest';
import { UserModel } from '@models/User';
import { ERRORS } from '@errors';
import { removeFileByPath } from '@utils/remove-file-by-path';
import { signUpRequest } from '@test-utils/request-auth';

describe('DELETE /users/me/template/:hash', () => {
  const mockRemoveFileByPath = jest.mocked(removeFileByPath);

  beforeEach(() => {
    mockRemoveFileByPath.mockClear();
  });

  it('Should return status 401 and an expected message if user is not signed in', async () => {
    const response = await request(global.app).delete(
      '/api/users/me/template/1234',
    );

    expect(response.body.error.message).toBe(ERRORS.UNAUTHORIZED);
    expect(response.status).toBe(401);
  });

  it('Should return status 404 and an expected message when user is not found, been deleted for unknown reason', async () => {
    const { sessionCookie, csrfToken, currentUser } = await signUpRequest(
      global.app,
    );

    await UserModel.deleteOne({ _id: currentUser._id });

    const response = await request(global.app)
      .delete(`/api/users/me/template/1234`)
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    expect(response.body.error.message).toBe(ERRORS.USER_NOT_FOUND);
    expect(response.status).toBe(404);
  });

  it('Should return status 404 and an expected message when section is not found', async () => {
    const { sessionCookie, csrfToken } = await signUpRequest(global.app);

    const response = await request(global.app)
      .delete(`/api/users/me/template/1234`)
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    expect(response.body.error.message).toBe(ERRORS.SECTION_NOT_FOUND);
    expect(response.status).toBe(404);
  });

  it('Should return status 400 and an expected message if section is not a file', async () => {
    const hash = '1234';
    const { sessionCookie, csrfToken, currentUser } = await signUpRequest(
      global.app,
    );

    await UserModel.updateOne(
      { _id: currentUser._id },
      {
        $set: {
          template: {
            sections: [
              { hash, type: 'pic', url: 'https://picsum.photos/200/300' },
            ],
          },
        },
      },
    );

    const response = await request(global.app)
      .delete(`/api/users/me/template/${hash}`)
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    expect(response.body.error.message).toBe(ERRORS.SECTION_NOT_FILE);
    expect(response.status).toBe(400);
  });

  it('Should return status 400 and an expected message if section is not a file', async () => {
    const hash = '1234';
    const { sessionCookie, csrfToken, currentUser } = await signUpRequest(
      global.app,
    );

    await UserModel.updateOne(
      { _id: currentUser._id },
      {
        $set: {
          template: {
            sections: [
              { hash, type: 'pic', url: 'https://picsum.photos/200/300' },
            ],
          },
        },
      },
    );

    const response = await request(global.app)
      .delete(`/api/users/me/template/${hash}`)
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    expect(response.body.error.message).toBe(ERRORS.SECTION_NOT_FILE);
    expect(response.status).toBe(400);
  });

  it('Should return status 400 and an expected message if section is not a picture type', async () => {
    const hash = '1234';
    const { sessionCookie, csrfToken, currentUser } = await signUpRequest(
      global.app,
    );

    await UserModel.updateOne(
      { _id: currentUser._id },
      {
        $set: {
          template: {
            sections: [{ hash, type: 'text', content: 'My text section' }],
          },
        },
      },
    );

    const response = await request(global.app)
      .delete(`/api/users/me/template/${hash}`)
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    expect(response.body.error.message).toBe(ERRORS.SECTION_NOT_FILE);
    expect(response.status).toBe(400);
  });

  it('Should delete picture file corresponding to the deleted post picture sections with isFile=true', async () => {
    const hash = '1234';
    const { sessionCookie, csrfToken, currentUser } = await signUpRequest(
      global.app,
    );

    const path = `/uploads/${currentUser._id}/1234.jpg`;

    await UserModel.updateOne(
      { _id: currentUser._id },
      {
        $set: {
          template: {
            sections: [{ hash, type: 'pic', isFile: true, url: path }],
          },
        },
      },
    );

    const response = await request(global.app)
      .delete(`/api/users/me/template/${hash}`)
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    expect(mockRemoveFileByPath).toHaveBeenCalledWith(path);
    expect(response.status).toBe(200);
  });

  it('Should remove section without deleting file when file does not belong to the current user', async () => {
    const hash = '1234';
    const path = '/uploads/anotherUser/1234.jpg';
    const { sessionCookie, csrfToken, currentUser } = await signUpRequest(
      global.app,
    );

    await UserModel.updateOne(
      { _id: currentUser._id },
      {
        $set: {
          template: {
            sections: [{ hash, type: 'pic', isFile: true, url: path }],
          },
        },
      },
    );

    const response = await request(global.app)
      .delete(`/api/users/me/template/${hash}`)
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    expect(response.status).toBe(200);
    expect(mockRemoveFileByPath).not.toHaveBeenCalled();

    const updatedUser = await UserModel.findById(currentUser._id).select(
      'template',
    );
    expect(updatedUser!.template.sections).toHaveLength(0);
  });
});
