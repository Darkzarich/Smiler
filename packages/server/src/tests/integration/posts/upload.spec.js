/* eslint-disable security/detect-non-literal-fs-filename */
import request from 'supertest';
import Sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import User from '../../../models/User.js';
import { generateRandomUser } from '../../data-generators/index.js';
import { signUpRequest } from '../../utils/request-auth.js';
import { ERRORS } from '../../../errors/index.js';
import {
  POST_SECTIONS_MAX,
  POST_MAX_UPLOAD_IMAGE_SIZE,
  POST_MAX_IMAGE_HEIGHT,
  POST_MAX_IMAGE_WIDTH,
  BASE_UPLOAD_FOLDER,
} from '../../../constants/index.js';

const createTestImage = async (extension = Sharp.format.png) =>
  Sharp({
    create: {
      width: 100,
      height: 100,
      channels: 4,
      background: { r: 255, g: 0, b: 0, alpha: 0.5 },
    },
  })
    .toFormat(extension)
    .toBuffer();

describe('POST /posts/upload', () => {
  const TEST_UPLOAD_DIR = path.join(process.cwd(), BASE_UPLOAD_FOLDER);

  async function cleanTestUploadDir(userFolder = '') {
    return fs.rm(path.join(TEST_UPLOAD_DIR, userFolder), {
      recursive: true,
      force: true,
    });
  }

  it('Should return status 401 and an expected message if user is not signed in', async () => {
    const response = await request(global.app).post('/api/posts/upload');

    expect(response.body.error.message).toBe(ERRORS.UNAUTHORIZED);
    expect(response.status).toBe(401);
  });

  it("Should return status 404 and an expected message if didn't find the user", async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    await User.deleteOne({ _id: currentUser.id });

    const response = await request(global.app)
      .post('/api/posts/upload')
      .set('Cookie', sessionCookie);

    expect(response.body.error.message).toBe(ERRORS.USER_NOT_FOUND);
    expect(response.status).toBe(404);
  });

  it('Should return status 413 and an expected message if the post has too many sections', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    await User.updateOne(
      { _id: currentUser.id },
      {
        $set: {
          template: {
            sections: Array(POST_SECTIONS_MAX).fill({}),
          },
        },
      },
    );

    const response = await request(global.app)
      .post('/api/posts/upload')
      .set('Cookie', sessionCookie);

    expect(response.body.error.message).toBe(ERRORS.POST_SECTIONS_MAX_EXCEEDED);
    expect(response.status).toBe(413);
  });

  it('Should return status 422 and reject uploading image file with not supported extension', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const testImage = await createTestImage(Sharp.format.jp2);

    const response = await request(global.app)
      .post('/api/posts/upload')
      .set('Cookie', sessionCookie)
      .attach('picture', testImage, 'test.jp2');

    expect(response.status).toBe(422);
    expect(response.body.error.message).toBe(
      ERRORS.POST_INVALID_ATTACHMENT_EXTENSION,
    );

    await cleanTestUploadDir(currentUser.id);
  });

  it('Should return status 413 and reject uploading too big image file', async () => {
    const largeFile = Buffer.alloc(POST_MAX_UPLOAD_IMAGE_SIZE + 1);

    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const response = await request(global.app)
      .post('/api/posts/upload')
      .set('Cookie', sessionCookie)
      .attach('picture', largeFile, 'test.png');

    expect(response.status).toBe(413);
    expect(response.body.error.message).toBe(
      ERRORS.POST_MAX_UPLOAD_IMAGE_SIZE_EXCEEDED,
    );

    await cleanTestUploadDir(currentUser.id);
  });

  it.each([
    Sharp.format.png,
    Sharp.format.jpeg,
    { ...Sharp.format.jpeg, id: 'jpg' },
    Sharp.format.gif,
  ])('Should upload valid image file with extension ".$id"', async (format) => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const testImage = await createTestImage(format);

    const response = await request(global.app)
      .post('/api/posts/upload')
      .set('Cookie', sessionCookie)
      .attach('picture', testImage, `test.${format.id}`);

    const uploadPath = path.join(TEST_UPLOAD_DIR, currentUser.id);

    const files = await fs.readdir(uploadPath);

    expect(response.status).toBe(200);
    expect(files.length).toBe(1);
    expect(files[0]).toMatch(/^\d+\.\w+$/);
    await expect(fs.access(uploadPath)).resolves.toBeUndefined();

    await cleanTestUploadDir(currentUser.id);
  });

  it('Should resize original uploaded image', async () => {
    // Some gradient svg just to compose and make the image bigger
    const gradientSvg =
      '<svg width="1000" height="1000" version="1.1" xmlns="http://www.w3.org/2000/svg">' +
      '  <defs>' +
      '      <linearGradient id="Gradient2" x1="0" x2="0" y1="0" y2="1">' +
      '        <stop offset="0%" stop-color="green" stop-opacity="60"/>' +
      '        <stop offset="100%" stop-color="blue" stop-opacity="0"/>' +
      '      </linearGradient>' +
      '  </defs>' +
      '<rect x="0" y="0" width="1000" height="1000" fill="url(#Gradient2)"/>' +
      '</svg>';

    const buffer = await Sharp({
      create: {
        width: 1000,
        height: 1000,
        channels: 4,
        background: { r: 232, g: 32, b: 111, alpha: 0.8 },
      },
    })
      .composite([{ input: Buffer.from(gradientSvg) }])
      .toFormat(Sharp.format.jpeg)
      .toBuffer();

    const originalFileSize = buffer.byteLength;

    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const uploadPath = path.join(TEST_UPLOAD_DIR, currentUser.id);

    await request(global.app)
      .post('/api/posts/upload')
      .set('Cookie', sessionCookie)
      .attach('picture', buffer, `test.png`);

    const files = await fs.readdir(uploadPath);
    const newFile = await fs.readFile(path.join(uploadPath, files[0]));

    const newImageSize = await Sharp(newFile).metadata();

    expect(originalFileSize).toBeGreaterThan(newFile.byteLength);
    expect(newImageSize.width).toBe(POST_MAX_IMAGE_WIDTH);
    expect(newImageSize.height).toBe(POST_MAX_IMAGE_HEIGHT);

    await cleanTestUploadDir(currentUser.id);
  });

  it('Should return status 200 and a new section with isFile=true and add section to user template', async () => {
    const testImage = await createTestImage(Sharp.format.jpg);

    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const uploadPath = path.join(TEST_UPLOAD_DIR, currentUser.id);

    const response = await request(global.app)
      .post('/api/posts/upload')
      .set('Cookie', sessionCookie)
      .attach('picture', testImage, 'test.png');

    const files = await fs.readdir(uploadPath);

    const user = await User.findById(currentUser.id)
      .select({ template: 1 })
      .lean();

    const section = {
      hash: expect.any(String),
      type: 'pic',
      url: `${BASE_UPLOAD_FOLDER}/${currentUser.id}/${files[0]}`,
      isFile: true,
    };

    expect(response.status).toBe(200);
    expect(response.body).toEqual(section);
    expect(user.template.sections).toEqual([section]);

    await cleanTestUploadDir(currentUser.id);
  });
});
