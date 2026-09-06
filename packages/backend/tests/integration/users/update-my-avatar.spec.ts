/* eslint-disable security/detect-non-literal-fs-filename */
import fs from 'fs/promises';
import path from 'path';
import request from 'supertest';
import Sharp from 'sharp';
import { BASE_UPLOAD_FOLDER, USER_AVATAR_SIZE } from '@constants/index';
import { ERRORS, ValidationError } from '@errors';
import * as fetchExternalImageModule from '@libs/fetch-external-image';
import { UserModel } from '@models/User';
import { removeFileByPath } from '@utils/remove-file-by-path';
import { signUpRequest } from '@test-utils/request-auth';

const REMOTE_URL = 'https://cdn.example.com/avatar.png';

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

describe('PUT /users/me/avatar', () => {
  const TEST_UPLOAD_DIR = path.join(process.cwd(), BASE_UPLOAD_FOLDER);

  let fetchExternalImage: jest.SpiedFunction<
    typeof fetchExternalImageModule.fetchExternalImage
  >;

  beforeEach(() => {
    fetchExternalImage = jest.spyOn(
      fetchExternalImageModule,
      'fetchExternalImage',
    );
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
    const response = await request(global.app)
      .put('/api/users/me/avatar')
      .send({ url: REMOTE_URL });

    expect(response.body.error.message).toBe(ERRORS.UNAUTHORIZED);
    expect(response.status).toBe(401);
  });

  it('Should return status 422 and an expected message if no url was sent', async () => {
    const { sessionCookie, csrfToken } = await signUpRequest(global.app);

    const response = await request(global.app)
      .put('/api/users/me/avatar')
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken)
      .send({});

    expect(response.body.error.message).toBe(ERRORS.USER_AVATAR_URL_REQUIRED);
    expect(response.status).toBe(422);
    expect(fetchExternalImage).not.toHaveBeenCalled();
  });

  it("Should pass on the downloader's verdict when it refuses the url", async () => {
    const { sessionCookie, csrfToken } = await signUpRequest(global.app);

    fetchExternalImage.mockRejectedValue(
      new ValidationError(ERRORS.EXTERNAL_IMAGE_URL_INVALID),
    );

    const response = await request(global.app)
      .put('/api/users/me/avatar')
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken)
      .send({ url: 'http://169.254.169.254/latest/avatar.png' });

    expect(response.body.error.message).toBe(ERRORS.EXTERNAL_IMAGE_URL_INVALID);
    expect(response.status).toBe(422);
  });

  it('Should store a square avatar on this server and never the url that was sent', async () => {
    const { sessionCookie, csrfToken, currentUser } = await signUpRequest(
      global.app,
    );

    fetchExternalImage.mockResolvedValue(await createTestImage());

    const response = await request(global.app)
      .put('/api/users/me/avatar')
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken)
      .send({ url: REMOTE_URL });

    expect(response.status).toBe(200);
    expect(
      response.body.avatar.startsWith(
        `${BASE_UPLOAD_FOLDER}/${currentUser._id}/`,
      ),
    ).toBe(true);
    expect(response.body.avatar).not.toContain('cdn.example.com');

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

    fetchExternalImage.mockResolvedValue(await createTestImage());

    const first = await request(global.app)
      .put('/api/users/me/avatar')
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken)
      .send({ url: REMOTE_URL });

    await request(global.app)
      .put('/api/users/me/avatar')
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken)
      .send({ url: REMOTE_URL });

    expect(removeFileByPath).toHaveBeenCalledWith(first.body.avatar);

    await cleanTestUploadDir(currentUser._id);
  });

  it('Should leave an avatar hotlinked before this endpoint existed alone', async () => {
    const { sessionCookie, csrfToken, currentUser } = await signUpRequest(
      global.app,
    );

    await UserModel.updateOne(
      { _id: currentUser._id },
      { $set: { avatar: 'https://cdn.example.com/legacy-avatar.jpg' } },
    );

    fetchExternalImage.mockResolvedValue(await createTestImage());

    await request(global.app)
      .put('/api/users/me/avatar')
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken)
      .send({ url: REMOTE_URL });

    expect(removeFileByPath).not.toHaveBeenCalled();

    await cleanTestUploadDir(currentUser._id);
  });
});

describe('DELETE /users/me/avatar', () => {
  const TEST_UPLOAD_DIR = path.join(process.cwd(), BASE_UPLOAD_FOLDER);

  beforeEach(() => {
    jest.mocked(removeFileByPath).mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('Should return status 401 and an expected message if user is not signed in', async () => {
    const response = await request(global.app).delete('/api/users/me/avatar');

    expect(response.body.error.message).toBe(ERRORS.UNAUTHORIZED);
    expect(response.status).toBe(401);
  });

  it('Should clear the avatar and delete the file behind it', async () => {
    const { sessionCookie, csrfToken, currentUser } = await signUpRequest(
      global.app,
    );

    jest
      .spyOn(fetchExternalImageModule, 'fetchExternalImage')
      .mockResolvedValue(await createTestImage());

    const created = await request(global.app)
      .put('/api/users/me/avatar')
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken)
      .send({ url: REMOTE_URL });

    const response = await request(global.app)
      .delete('/api/users/me/avatar')
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken);

    expect(response.status).toBe(200);
    expect(removeFileByPath).toHaveBeenCalledWith(created.body.avatar);

    const user = await UserModel.findById(currentUser._id).lean();

    expect(user!.avatar).toBe('');

    await fs.rm(path.join(TEST_UPLOAD_DIR, currentUser._id), {
      recursive: true,
      force: true,
    });
  });
});
