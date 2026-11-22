/* eslint-disable security/detect-non-literal-fs-filename */
import fs from 'fs/promises';
import path from 'path';
import request from 'supertest';
import Sharp from 'sharp';
import {
  BASE_UPLOAD_FOLDER,
  POST_MAX_UPLOAD_IMAGE_SIZE,
  USER_AVATAR_SIZE,
} from '@constants/index';
import { ERRORS } from '@errors';
import { UserModel } from '@models/User';
import { removeFileByPath } from '@utils/remove-file-by-path';
import { signUpRequest } from '@test-utils/request-auth';

const createTestImage = (width = 800, height = 600) =>
  Sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 0, g: 200, b: 100 },
    },
  })
    .png()
    .toBuffer();

describe('POST /users/me/avatar', () => {
  const TEST_UPLOAD_DIR = path.join(process.cwd(), BASE_UPLOAD_FOLDER);

  beforeEach(() => {
    jest.mocked(removeFileByPath).mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  async function cleanTestUploadDir(userFolder = '') {
    return fs.rm(path.join(TEST_UPLOAD_DIR, userFolder), {
      recursive: true,
      force: true,
    });
  }

  it('Should return status 401 and an expected message if user is not signed in', async () => {
    const response = await request(global.app).post('/api/users/me/avatar');

    expect(response.body.error.message).toBe(ERRORS.UNAUTHORIZED);
    expect(response.status).toBe(401);
  });

  it("Should return status 404 and an expected message if didn't find the user", async () => {
    const { sessionCookie, csrfToken, currentUser } = await signUpRequest(
      global.app,
    );

    await UserModel.deleteOne({ _id: currentUser._id });

    const response = await request(global.app)
      .post('/api/users/me/avatar')
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken)
      .attach('picture', await createTestImage(), 'test.png');

    expect(response.body.error.message).toBe(ERRORS.USER_NOT_FOUND);
    expect(response.status).toBe(404);
  });

  it('Should return status 422 and reject a file that is not a picture', async () => {
    const { sessionCookie, csrfToken, currentUser } = await signUpRequest(
      global.app,
    );

    const response = await request(global.app)
      .post('/api/users/me/avatar')
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken)
      .attach('picture', Buffer.from('not an image'), 'test.png');

    expect(response.status).toBe(422);
    expect(response.body.error.message).toBe(
      ERRORS.POST_INVALID_ATTACHMENT_EXTENSION,
    );
    await expect(
      fs.readdir(path.join(TEST_UPLOAD_DIR, currentUser._id)),
    ).rejects.toThrow();

    await cleanTestUploadDir(currentUser._id);
  });

  it('Should return status 422 and reject a file browsers do not label as a picture', async () => {
    const { sessionCookie, csrfToken } = await signUpRequest(global.app);

    const response = await request(global.app)
      .post('/api/users/me/avatar')
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken)
      .attach('picture', Buffer.from('hello'), {
        filename: 'notes.txt',
        contentType: 'text/plain',
      });

    expect(response.status).toBe(422);
    expect(response.body.error.message).toBe(
      ERRORS.POST_INVALID_ATTACHMENT_EXTENSION,
    );
  });

  it('Should return status 413 and reject a picture over the upload limit', async () => {
    const { sessionCookie, csrfToken, currentUser } = await signUpRequest(
      global.app,
    );

    const response = await request(global.app)
      .post('/api/users/me/avatar')
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken)
      .attach(
        'picture',
        Buffer.alloc(POST_MAX_UPLOAD_IMAGE_SIZE + 1),
        'test.png',
      );

    expect(response.status).toBe(413);
    expect(response.body.error.message).toBe(
      ERRORS.POST_MAX_UPLOAD_IMAGE_SIZE_EXCEEDED,
    );

    await cleanTestUploadDir(currentUser._id);
  });

  it('Should store a square avatar on this server', async () => {
    const { sessionCookie, csrfToken, currentUser } = await signUpRequest(
      global.app,
    );

    const response = await request(global.app)
      .post('/api/users/me/avatar')
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken)
      .attach('picture', await createTestImage(), 'test.png');

    expect(response.status).toBe(200);
    expect(
      response.body.avatar.startsWith(
        `${BASE_UPLOAD_FOLDER}/${currentUser._id}/`,
      ),
    ).toBe(true);

    const user = await UserModel.findById(currentUser._id).lean();

    expect(user!.avatar).toBe(response.body.avatar);

    const written = await fs.readFile(
      path.join(
        TEST_UPLOAD_DIR,
        currentUser._id,
        user!.avatar.split('/').pop()!,
      ),
    );
    const metadata = await Sharp(written).metadata();

    expect(metadata.format).toBe('jpeg');
    expect(metadata.width).toBe(USER_AVATAR_SIZE);
    expect(metadata.height).toBe(USER_AVATAR_SIZE);

    await cleanTestUploadDir(currentUser._id);
  });

  it('Should delete the file the previous avatar left behind', async () => {
    const { sessionCookie, csrfToken, currentUser } = await signUpRequest(
      global.app,
    );

    const first = await request(global.app)
      .post('/api/users/me/avatar')
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken)
      .attach('picture', await createTestImage(), 'test.png');

    await request(global.app)
      .post('/api/users/me/avatar')
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken)
      .attach('picture', await createTestImage(), 'test.png');

    expect(removeFileByPath).toHaveBeenCalledWith(first.body.avatar);

    await cleanTestUploadDir(currentUser._id);
  });

  it('Should leave an avatar hotlinked before the upload endpoints existed alone', async () => {
    const { sessionCookie, csrfToken, currentUser } = await signUpRequest(
      global.app,
    );

    await UserModel.updateOne(
      { _id: currentUser._id },
      { $set: { avatar: 'https://cdn.example.com/legacy-avatar.jpg' } },
    );

    await request(global.app)
      .post('/api/users/me/avatar')
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken)
      .attach('picture', await createTestImage(), 'test.png');

    expect(removeFileByPath).not.toHaveBeenCalled();

    await cleanTestUploadDir(currentUser._id);
  });
});
