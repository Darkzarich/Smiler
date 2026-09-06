/* eslint-disable security/detect-non-literal-fs-filename */
import fs from 'fs/promises';
import path from 'path';
import request from 'supertest';
import Sharp from 'sharp';
import {
  BASE_UPLOAD_FOLDER,
  POST_MAX_IMAGE_HEIGHT,
  POST_MAX_IMAGE_WIDTH,
  POST_SECTIONS_MAX,
} from '@constants/index';
import { ERRORS, ValidationError } from '@errors';
import * as fetchExternalImageModule from '@libs/fetch-external-image';
import { UserModel } from '@models/User';
import { signUpRequest } from '@test-utils/request-auth';

const RANDOM_JPG_FILENAME_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/i;

const REMOTE_URL = 'https://cdn.example.com/picture.png';

const createTestImage = (width = 100, height = 100) =>
  Sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 255, g: 0, b: 0 },
    },
  })
    .png()
    .toBuffer();

describe('POST /posts/upload/url', () => {
  const TEST_UPLOAD_DIR = path.join(process.cwd(), BASE_UPLOAD_FOLDER);

  // The downloader has its own spec; here it only has to stand in for a remote
  // host so the endpoint's own behavior is what gets exercised.
  let fetchExternalImage: jest.SpiedFunction<
    typeof fetchExternalImageModule.fetchExternalImage
  >;

  beforeEach(() => {
    fetchExternalImage = jest.spyOn(
      fetchExternalImageModule,
      'fetchExternalImage',
    );
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
      .post('/api/posts/upload/url')
      .send({ url: REMOTE_URL });

    expect(response.body.error.message).toBe(ERRORS.UNAUTHORIZED);
    expect(response.status).toBe(401);
  });

  it('Should return status 422 and an expected message if no url was sent', async () => {
    const { sessionCookie, csrfToken } = await signUpRequest(global.app);

    const response = await request(global.app)
      .post('/api/posts/upload/url')
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken)
      .send({ url: '   ' });

    expect(response.body.error.message).toBe(
      ERRORS.EXTERNAL_IMAGE_URL_REQUIRED,
    );
    expect(response.status).toBe(422);
    expect(fetchExternalImage).not.toHaveBeenCalled();
  });

  it("Should return status 404 and an expected message if didn't find the user", async () => {
    const { sessionCookie, csrfToken, currentUser } = await signUpRequest(
      global.app,
    );

    await UserModel.deleteOne({ _id: currentUser._id });

    const response = await request(global.app)
      .post('/api/posts/upload/url')
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken)
      .send({ url: REMOTE_URL });

    expect(response.body.error.message).toBe(ERRORS.USER_NOT_FOUND);
    expect(response.status).toBe(404);
    expect(fetchExternalImage).not.toHaveBeenCalled();
  });

  it('Should return status 413 and an expected message if the template has too many sections', async () => {
    const { sessionCookie, csrfToken, currentUser } = await signUpRequest(
      global.app,
    );

    await UserModel.updateOne(
      { _id: currentUser._id },
      { $set: { template: { sections: Array(POST_SECTIONS_MAX).fill({}) } } },
    );

    const response = await request(global.app)
      .post('/api/posts/upload/url')
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken)
      .send({ url: REMOTE_URL });

    expect(response.body.error.message).toBe(ERRORS.POST_SECTIONS_MAX_EXCEEDED);
    expect(response.status).toBe(413);
    expect(fetchExternalImage).not.toHaveBeenCalled();
  });

  it("Should pass on the downloader's verdict when it refuses the url", async () => {
    const { sessionCookie, csrfToken } = await signUpRequest(global.app);

    fetchExternalImage.mockRejectedValue(
      new ValidationError(ERRORS.EXTERNAL_IMAGE_URL_INVALID),
    );

    const response = await request(global.app)
      .post('/api/posts/upload/url')
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken)
      .send({ url: 'http://127.0.0.1/picture.png' });

    expect(response.body.error.message).toBe(ERRORS.EXTERNAL_IMAGE_URL_INVALID);
    expect(response.status).toBe(422);
  });

  it('Should return status 422 if the downloaded bytes are not a picture', async () => {
    const { sessionCookie, csrfToken, currentUser } = await signUpRequest(
      global.app,
    );

    fetchExternalImage.mockResolvedValue(Buffer.from('<html>nope</html>'));

    const response = await request(global.app)
      .post('/api/posts/upload/url')
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken)
      .send({ url: REMOTE_URL });

    expect(response.body.error.message).toBe(
      ERRORS.EXTERNAL_IMAGE_NOT_AN_IMAGE,
    );
    expect(response.status).toBe(422);

    const user = await UserModel.findById(currentUser._id).lean();

    expect(user!.template.sections).toHaveLength(0);
  });

  it('Should store the picture on this server and return a section pointing at it', async () => {
    const { sessionCookie, csrfToken, currentUser } = await signUpRequest(
      global.app,
    );

    fetchExternalImage.mockResolvedValue(await createTestImage());

    const response = await request(global.app)
      .post('/api/posts/upload/url')
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken)
      .send({ url: REMOTE_URL });

    expect(response.status).toBe(200);
    expect(fetchExternalImage).toHaveBeenCalledWith(REMOTE_URL);

    // The url the user pasted must not survive anywhere in the response: the
    // whole point is that no reader is sent to that host.
    expect(response.body.url).not.toContain('cdn.example.com');
    expect(response.body).toEqual({
      type: 'pic',
      hash: expect.any(String),
      isFile: true,
      url: expect.stringContaining(`${BASE_UPLOAD_FOLDER}/${currentUser._id}/`),
    });

    const filename = response.body.url.split('/').pop();

    expect(filename).toMatch(RANDOM_JPG_FILENAME_REGEX);

    const written = await fs.readFile(
      path.join(TEST_UPLOAD_DIR, currentUser._id, filename),
    );
    const metadata = await Sharp(written).metadata();

    // Stored re-encoded, never as the bytes the remote host served.
    expect(metadata.format).toBe('jpeg');

    await cleanTestUploadDir(currentUser._id);
  });

  it('Should resize a picture that is larger than a post can show', async () => {
    const { sessionCookie, csrfToken, currentUser } = await signUpRequest(
      global.app,
    );

    fetchExternalImage.mockResolvedValue(await createTestImage(4000, 4000));

    const response = await request(global.app)
      .post('/api/posts/upload/url')
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken)
      .send({ url: REMOTE_URL });

    expect(response.status).toBe(200);

    const written = await fs.readFile(
      path.join(
        TEST_UPLOAD_DIR,
        currentUser._id,
        response.body.url.split('/').pop(),
      ),
    );
    const metadata = await Sharp(written).metadata();

    expect(metadata.width).toBe(POST_MAX_IMAGE_WIDTH);
    expect(metadata.height).toBe(POST_MAX_IMAGE_HEIGHT);

    await cleanTestUploadDir(currentUser._id);
  });

  it('Should append the picture to the saved template', async () => {
    const { sessionCookie, csrfToken, currentUser } = await signUpRequest(
      global.app,
    );

    fetchExternalImage.mockResolvedValue(await createTestImage());

    const response = await request(global.app)
      .post('/api/posts/upload/url')
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', csrfToken)
      .send({ url: REMOTE_URL });

    const user = await UserModel.findById(currentUser._id).lean();

    expect(user!.template.sections).toEqual([
      {
        type: 'pic',
        hash: response.body.hash,
        isFile: true,
        url: response.body.url,
      },
    ]);

    await cleanTestUploadDir(currentUser._id);
  });
});
