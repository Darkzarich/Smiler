import request from 'supertest';
import { omit, pick } from 'lodash';
import {
  POST_SECTIONS_MAX,
  POST_TITLE_MAX_LENGTH,
  POST_MAX_TAGS,
  POST_MAX_TAG_LEN,
  POST_SECTIONS_MAX_LENGTH,
} from '@constants/index';
import { signUpRequest } from '@test-utils/request-auth';
import { PostModel, POST_SECTION_TYPES } from '@models/Post';
import { UserModel } from '@models/User';
import { generateRandomPost } from '@test-data-generators';
import { ERRORS } from '@errors';

const post = generateRandomPost();

const requiredPostFields = pick(post, ['title', 'sections']);

describe('POST /posts', () => {
  it('Should return status 401 and an expected message if user is not signed in', async () => {
    const response = await request(global.app).post('/api/posts');

    expect(response.body.error.message).toBe(ERRORS.UNAUTHORIZED);
    expect(response.status).toBe(401);
  });

  it('Should return status 422 and an expected message if title is not provided', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .post('/api/posts')
      .set('Cookie', sessionCookie)
      .send(omit(requiredPostFields, 'title'));

    expect(response.body.error.message).toBe(ERRORS.POST_TITLE_REQUIRED);
    expect(response.status).toBe(422);
  });

  it('Should return status 422 and an expected message if sections are not provided', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .post('/api/posts')
      .set('Cookie', sessionCookie)
      .send(omit(requiredPostFields, 'sections'));

    expect(response.body.error.message).toBe(ERRORS.POST_SECTIONS_REQUIRED);
    expect(response.status).toBe(422);
  });

  it('Should return status 422 and an expected message if too many sections', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .post('/api/posts')
      .set('Cookie', sessionCookie)
      .send({
        ...requiredPostFields,
        sections: Array(POST_SECTIONS_MAX + 1).fill(
          requiredPostFields.sections[0],
        ),
      });

    expect(response.body.error.message).toBe(ERRORS.POST_SECTIONS_MAX_EXCEEDED);
    expect(response.status).toBe(422);
  });

  it('Should return status 422 and an expected message if title is too long', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .post('/api/posts')
      .set('Cookie', sessionCookie)
      .send({
        ...requiredPostFields,
        title: 'a'.repeat(POST_TITLE_MAX_LENGTH + 1),
      });

    expect(response.body.error.message).toBe(
      ERRORS.POST_TITLE_MAX_LENGTH_EXCEEDED,
    );
    expect(response.status).toBe(422);
  });

  it('Should return status 422 and an expected message if too many tags', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .post('/api/posts')
      .set('Cookie', sessionCookie)
      .send({
        ...requiredPostFields,
        tags: Array(POST_MAX_TAGS + 1).fill(post.tags[0]),
      });

    expect(response.body.error.message).toBe(ERRORS.POST_MAX_TAGS_EXCEEDED);
    expect(response.status).toBe(422);
  });

  it('Should return status 422 and an expected message if too long tag', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .post('/api/posts')
      .set('Cookie', sessionCookie)
      .send({
        ...requiredPostFields,
        tags: ['a'.repeat(POST_MAX_TAG_LEN + 1)],
      });

    expect(response.body.error.message).toBe(ERRORS.POST_TAG_MAX_LEN_EXCEEDED);
    expect(response.status).toBe(422);
  });

  it('Should return status 422 and an expected message if at least one section is unknown type', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .post('/api/posts')
      .set('Cookie', sessionCookie)
      .send({
        ...requiredPostFields,
        sections: [
          {
            type: 'unknown',
            content: 'some text',
          },
        ],
      });

    expect(response.body.error.message).toBe(
      ERRORS.POST_UNSUPPORTED_SECTION_TYPE,
    );
    expect(response.status).toBe(422);
  });

  it('Should return status 422 and an expected message if text section is empty', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .post('/api/posts')
      .set('Cookie', sessionCookie)
      .send({
        ...requiredPostFields,
        sections: [
          {
            type: POST_SECTION_TYPES.TEXT,
            content: '',
          },
        ],
      });

    expect(response.body.error.message).toBe(
      ERRORS.POST_TEXT_SECTION_CONTENT_REQUIRED,
    );
    expect(response.status).toBe(422);
  });

  it('Should return status 422 and an expected message if text section content is too long', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .post('/api/posts')
      .set('Cookie', sessionCookie)
      .send({
        ...requiredPostFields,
        sections: [
          // Check that sum of text sections content length is less than max
          {
            type: POST_SECTION_TYPES.TEXT,
            content: 'a'.repeat(POST_SECTIONS_MAX_LENGTH / 2),
          },
          {
            type: POST_SECTION_TYPES.TEXT,
            content: 'a'.repeat(POST_SECTIONS_MAX_LENGTH / 2 + 1),
          },
        ],
      });

    expect(response.body.error.message).toBe(
      ERRORS.POST_SECTIONS_MAX_LENGTH_EXCEEDED,
    );
    expect(response.status).toBe(422);
  });

  it('Should return status 422 and an expected message if pic section url is empty', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .post('/api/posts')
      .set('Cookie', sessionCookie)
      .send({
        ...requiredPostFields,
        sections: [
          {
            type: POST_SECTION_TYPES.PICTURE,
            url: '',
          },
        ],
      });

    expect(response.body.error.message).toBe(
      ERRORS.POST_PIC_SECTION_URL_REQUIRED,
    );
    expect(response.status).toBe(422);
  });

  it('Should return status 422 and an expected message if pic section url is not an URL', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .post('/api/posts')
      .set('Cookie', sessionCookie)
      .send({
        ...requiredPostFields,
        sections: [
          {
            type: POST_SECTION_TYPES.PICTURE,
            url: 'test',
          },
        ],
      });

    expect(response.body.error.message).toBe(
      ERRORS.POST_PIC_SECTION_URL_INVALID,
    );
    expect(response.status).toBe(422);
  });

  it('Should return status 422 and an expected message if pic section file url is not a valid URL', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .post('/api/posts')
      .set('Cookie', sessionCookie)
      .send({
        ...requiredPostFields,
        sections: [
          {
            type: POST_SECTION_TYPES.PICTURE,
            isFile: true,
            url: 'test',
          },
        ],
      });

    expect(response.body.error.message).toBe(
      ERRORS.POST_PIC_SECTION_URL_INVALID,
    );
    expect(response.status).toBe(422);
  });

  it('Should return status 422 and an expected message if video section url is empty', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .post('/api/posts')
      .set('Cookie', sessionCookie)
      .send({
        ...requiredPostFields,
        sections: [
          {
            type: POST_SECTION_TYPES.VIDEO,
            url: '',
          },
        ],
      });

    expect(response.body.error.message).toBe(
      ERRORS.POST_VIDEO_SECTION_URL_REQUIRED,
    );
    expect(response.status).toBe(422);
  });

  it('Should return status 422 and an expected message if video section url is not an URL', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .post('/api/posts')
      .set('Cookie', sessionCookie)
      .send({
        ...requiredPostFields,
        sections: [
          {
            type: POST_SECTION_TYPES.VIDEO,
            url: 'test',
          },
        ],
      });

    expect(response.body.error.message).toBe(
      ERRORS.POST_VIDEO_SECTION_URL_REQUIRED,
    );
    expect(response.status).toBe(422);
  });

  it('Should add the post to the database', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .post('/api/posts')
      .set('Cookie', sessionCookie)
      .send({
        ...requiredPostFields,
        tags: post.tags,
        sections: post.sections,
      });

    const postFromDb = await PostModel.findById(response.body.id).lean();

    expect(postFromDb).toMatchObject({
      title: requiredPostFields.title,
      sections: post.sections,
      tags: post.tags,
    });
  });

  it('Should return status 200 and the post after successful creation', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const response = await request(global.app)
      .post('/api/posts')
      .set('Cookie', sessionCookie)
      .send({
        ...requiredPostFields,
        tags: post.tags,
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: expect.any(String),
      slug: expect.stringMatching(/^.+-.+$/),
      title: requiredPostFields.title,
      sections: requiredPostFields.sections,
      author: {
        id: currentUser.id.toString(),
        login: expect.any(String),
        avatar: expect.any(String),
      },
      rating: 0,
      commentCount: 0,
      tags: post.tags,
      rated: {
        isRated: false,
        negative: false,
      },
      createdAt: expect.any(String),
    });
  });

  it('Should clear user template after successful creation', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    await UserModel.updateOne(
      { _id: currentUser.id },
      {
        $set: {
          'template.title': requiredPostFields.title,
          'template.sections': requiredPostFields.sections,
          'template.tags': ['test'],
        },
      },
    );

    await request(global.app)
      .post('/api/posts')
      .set('Cookie', sessionCookie)
      .send(requiredPostFields);

    const userFromDb = await UserModel.findById(currentUser.id).lean();

    expect(userFromDb!.template).toEqual({
      title: '',
      sections: [],
      tags: [],
    });
  });
});
