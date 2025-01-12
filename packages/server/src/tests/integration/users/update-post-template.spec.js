import request from 'supertest';
import { pick } from 'lodash-es';
import {
  POST_SECTIONS_MAX,
  POST_TITLE_MAX_LENGTH,
  POST_MAX_TAGS,
  POST_MAX_TAG_LEN,
} from '../../../constants/index.js';
import { signUpRequest } from '../../utils/request-auth.js';
import User from '../../../models/User.js';
import { generateRandomPost } from '../../data-generators/index.js';
import { ERRORS } from '../../../errors/index.js';

const post = generateRandomPost();

const requiredPostFields = pick(post, ['title', 'sections']);

describe('PUT /users/:id/template', () => {
  it('Should return status 401 and an expected message if user is not signed in', async () => {
    const response = await request(global.app).put('/api/users/1234/template');

    expect(response.body.error.message).toBe(ERRORS.UNAUTHORIZED);
    expect(response.status).toBe(401);
  });

  it('Should return status 422 and an expected message if title is too long', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .put('/api/users/1234/template')
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
      .put('/api/users/1234/template')
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
      .put('/api/users/1234/template')
      .set('Cookie', sessionCookie)
      .send({
        ...requiredPostFields,
        tags: ['a'.repeat(POST_MAX_TAG_LEN + 1)],
      });

    expect(response.body.error.message).toBe(ERRORS.POST_TAG_MAX_LEN_EXCEEDED);
    expect(response.status).toBe(422);
  });

  it('Should return status 422 and an expected message if too many sections', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .put('/api/users/1234/template')
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

  it('Should return status 200 and the updated template after a successful update', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .put('/api/users/1234/template')
      .set('Cookie', sessionCookie)
      .send({
        ...requiredPostFields,
        tags: post.tags,
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      title: requiredPostFields.title,
      tags: post.tags,
      sections: requiredPostFields.sections,
    });
  });

  it('Should update title in user.template in the database', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const template = {
      title: 'new title',
    };

    await request(global.app)
      .put('/api/users/1234/template')
      .set('Cookie', sessionCookie)
      .send(template);

    const userFromDb = await User.findById(currentUser.id).lean();

    expect(userFromDb.template.title).toBe(template.title);
  });

  it('Should update tags in user.template in the database', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const template = {
      tags: ['new tag'],
    };

    await request(global.app)
      .put('/api/users/1234/template')
      .set('Cookie', sessionCookie)
      .send(template);

    const userFromDb = await User.findById(currentUser.id).lean();

    expect(userFromDb.template.tags).toEqual(template.tags);
  });

  it('Should update sections in user.template in the database', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const template = {
      sections: [
        {
          type: 'text',
          content: 'new section',
        },
      ],
    };

    await request(global.app)
      .put('/api/users/1234/template')
      .set('Cookie', sessionCookie)
      .send(template);

    const userFromDb = await User.findById(currentUser.id).lean();

    expect(userFromDb.template.sections).toEqual(template.sections);
  });

  it('Should update all: title, tags and sections in user.template in the database', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const template = {
      title: 'new title',
      tags: ['new tag'],
      sections: [
        {
          type: 'text',
          content: 'new section',
        },
      ],
    };

    await request(global.app)
      .put('/api/users/1234/template')
      .set('Cookie', sessionCookie)
      .send(template);

    const userFromDb = await User.findById(currentUser.id).lean();

    expect(userFromDb.template).toEqual(template);
  });
});
