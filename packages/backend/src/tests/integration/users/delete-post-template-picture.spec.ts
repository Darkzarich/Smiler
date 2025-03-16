import request from 'supertest';
import User from '../../../models/User';
import { signUpRequest } from '../../utils/request-auth';
import { ERRORS } from '../../../errors/index';
import { removeFileByPath } from '../../../utils/remove-file-by-path';

const mockRemoveFileByPath = import.meta.jest.mocked(removeFileByPath);

describe('DELETE /users/me/template/:hash', () => {
  it('Should return status 401 and an expected message if user is not signed in', async () => {
    const response = await request(global.app).delete(
      '/api/users/me/template/1234',
    );

    expect(response.body.error.message).toBe(ERRORS.UNAUTHORIZED);
    expect(response.status).toBe(401);
  });

  it('Should return status 404 and an expected message when user is not found, been deleted for unknown reason', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    await User.deleteOne({ _id: currentUser.id });

    const response = await request(global.app)
      .delete(`/api/users/me/template/1234`)
      .set('Cookie', sessionCookie);

    expect(response.body.error.message).toBe(ERRORS.USER_NOT_FOUND);
    expect(response.status).toBe(404);
  });

  it('Should return status 404 and an expected message when section is not found', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .delete(`/api/users/me/template/1234`)
      .set('Cookie', sessionCookie);

    expect(response.body.error.message).toBe(ERRORS.SECTION_NOT_FOUND);
    expect(response.status).toBe(404);
  });

  it('Should return status 400 and an expected message if section is not a file', async () => {
    const hash = '1234';
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    await User.updateOne(
      { _id: currentUser.id },
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
      .set('Cookie', sessionCookie);

    expect(response.body.error.message).toBe(ERRORS.SECTION_NOT_FILE);
    expect(response.status).toBe(400);
  });

  it('Should return status 400 and an expected message if section is not a file', async () => {
    const hash = '1234';
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    await User.updateOne(
      { _id: currentUser.id },
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
      .set('Cookie', sessionCookie);

    expect(response.body.error.message).toBe(ERRORS.SECTION_NOT_FILE);
    expect(response.status).toBe(400);
  });

  it('Should return status 400 and an expected message if section is not a picture type', async () => {
    const hash = '1234';
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    await User.updateOne(
      { _id: currentUser.id },
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
      .set('Cookie', sessionCookie);

    expect(response.body.error.message).toBe(ERRORS.SECTION_NOT_FILE);
    expect(response.status).toBe(400);
  });

  it('Should delete picture file corresponding to the deleted post picture sections with isFile=true', async () => {
    const hash = '1234';
    const path = '/uploads/currentUser/1234.jpg';
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    await User.updateOne(
      { _id: currentUser.id },
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
      .set('Cookie', sessionCookie);

    expect(mockRemoveFileByPath).toHaveBeenCalledWith(path);
    expect(response.status).toBe(200);
  });
});
