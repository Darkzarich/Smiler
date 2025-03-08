import request from 'supertest';
import { pick } from 'lodash-es';
import {
  POST_SECTIONS_MAX,
  POST_TITLE_MAX_LENGTH,
  POST_MAX_TAGS,
  POST_MAX_TAG_LEN,
  POST_SECTIONS_MAX_LENGTH,
  POST_SECTION_TYPES,
  POST_TIME_TO_UPDATE,
} from '../../../constants/index.js';
import { signUpRequest } from '../../utils/request-auth.js';
import Post from '../../../models/Post.js';
import { generateRandomPost } from '../../data-generators/index.js';
import { ERRORS } from '../../../errors/index.js';
import { removeFileByPath } from '../../../utils/remove-file-by-path.js';

const requiredPostFields = pick(generateRandomPost(), ['title', 'sections']);

const mockRemoveFileByPath = import.meta.jest.mocked(removeFileByPath);

describe('PUT /posts/:id', () => {
  it('Should return status 401 and an expected message if user is not signed in', async () => {
    const response = await request(global.app).put('/api/posts/:id');

    expect(response.body.error.message).toBe(ERRORS.UNAUTHORIZED);
    expect(response.status).toBe(401);
  });

  it('Should return status 404 and an expected message if post does not exist', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .put(`/api/posts/5d5467b4c17806706f3df347`)
      .set('Cookie', sessionCookie)
      .send(requiredPostFields);

    expect(response.body.error.message).toBe(ERRORS.POST_NOT_FOUND);
    expect(response.status).toBe(404);
  });

  it('Should return status 403 and an expected message if comment is older than 10 min', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const post = await Post.create(
      generateRandomPost({
        author: currentUser.id,
        createdAt: Date.now() - POST_TIME_TO_UPDATE - 1,
      }),
    );

    const response = await request(global.app)
      .put(`/api/posts/${post._id}`)
      .set('Cookie', sessionCookie);

    expect(response.body.error.message).toBe(ERRORS.POST_CAN_EDIT_WITHIN_TIME);
    expect(response.status).toBe(403);
  });

  it('Should return status 422 and an expected message if too many sections', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const post = await Post.create(
      generateRandomPost({
        author: currentUser.id,
      }),
    );

    const response = await request(global.app)
      .put(`/api/posts/${post._id}`)
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
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const post = await Post.create(
      generateRandomPost({
        author: currentUser.id,
      }),
    );

    const response = await request(global.app)
      .put(`/api/posts/${post._id}`)
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
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const post = await Post.create(
      generateRandomPost({
        author: currentUser.id,
      }),
    );

    const response = await request(global.app)
      .put(`/api/posts/${post._id}`)
      .set('Cookie', sessionCookie)
      .send({
        ...requiredPostFields,
        tags: Array(POST_MAX_TAGS + 1).fill(post.tags[0]),
      });

    expect(response.body.error.message).toBe(ERRORS.POST_MAX_TAGS_EXCEEDED);
    expect(response.status).toBe(422);
  });

  it('Should return status 422 and an expected message if too long tag', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const post = await Post.create(
      generateRandomPost({
        author: currentUser.id,
      }),
    );

    const response = await request(global.app)
      .put(`/api/posts/${post._id}`)
      .set('Cookie', sessionCookie)
      .send({
        ...requiredPostFields,
        tags: ['a'.repeat(POST_MAX_TAG_LEN + 1)],
      });

    expect(response.body.error.message).toBe(ERRORS.POST_TAG_MAX_LEN_EXCEEDED);
    expect(response.status).toBe(422);
  });

  it('Should return status 422 and an expected message if at least one section is unknown type', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const post = await Post.create(
      generateRandomPost({
        author: currentUser.id,
      }),
    );

    const response = await request(global.app)
      .put(`/api/posts/${post._id}`)
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
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const post = await Post.create(
      generateRandomPost({
        author: currentUser.id,
      }),
    );

    const response = await request(global.app)
      .put(`/api/posts/${post._id}`)
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
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const post = await Post.create(
      generateRandomPost({
        author: currentUser.id,
      }),
    );

    const response = await request(global.app)
      .put(`/api/posts/${post._id}`)
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
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const post = await Post.create(
      generateRandomPost({
        author: currentUser.id,
      }),
    );

    const response = await request(global.app)
      .put(`/api/posts/${post._id}`)
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
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const post = await Post.create(
      generateRandomPost({
        author: currentUser.id,
      }),
    );

    const response = await request(global.app)
      .put(`/api/posts/${post._id}`)
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
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const post = await Post.create(
      generateRandomPost({
        author: currentUser.id,
      }),
    );

    const response = await request(global.app)
      .put(`/api/posts/${post._id}`)
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
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const post = await Post.create(
      generateRandomPost({
        author: currentUser.id,
      }),
    );

    const response = await request(global.app)
      .put(`/api/posts/${post._id}`)
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
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const post = await Post.create(
      generateRandomPost({
        author: currentUser.id,
      }),
    );

    const response = await request(global.app)
      .put(`/api/posts/${post._id}`)
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

  it('Should edit the post in the database', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const post = await Post.create(
      generateRandomPost({
        author: currentUser.id,
      }),
    );

    const title = 'Updated test post';
    const newSections = [
      {
        type: POST_SECTION_TYPES.TEXT,
        content: 'Updated text',
      },
    ];
    const tags = ['update tag'];

    const response = await request(global.app)
      .put(`/api/posts/${post._id}`)
      .set('Cookie', sessionCookie)
      .send({
        title,
        sections: newSections,
        tags,
      });

    const postFromDb = await Post.findById(response.body.id).lean();

    expect(postFromDb).toMatchObject({
      title,
      sections: newSections,
      tags,
    });
  });

  it('Should return status 200 and the updated post', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const post = await Post.create(
      generateRandomPost({
        author: currentUser.id,
      }),
    );

    const title = 'Updated test post';
    const newSections = [
      {
        type: POST_SECTION_TYPES.TEXT,
        content: 'Updated text',
      },
    ];
    const tags = ['update tag'];

    const response = await request(global.app)
      .put(`/api/posts/${post._id}`)
      .set('Cookie', sessionCookie)
      .send({
        title,
        sections: newSections,
        tags,
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: expect.any(String),
      slug: expect.stringMatching(/^.+-.+$/),
      title,
      sections: newSections,
      author: {
        id: currentUser.id.toString(),
        login: expect.any(String),
        avatar: expect.any(String),
      },
      rating: 0,
      commentCount: 0,
      tags,
      rated: {
        isRated: false,
        negative: false,
      },
      createdAt: expect.any(String),
    });
  });

  it('Should return status 200 and fields that were not passed retaining their previous value', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const post = await Post.create(
      generateRandomPost({
        author: currentUser.id,
      }),
    );

    const title = 'Updated test post';

    const response = await request(global.app)
      .put(`/api/posts/${post._id}`)
      .set('Cookie', sessionCookie)
      .send({
        title,
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      title,
      sections: [...post.sections],
      tags: [...post.tags],
    });
  });

  it('Should delete picture files corresponding to the deleted post picture sections that have isFile=true', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    const post = await Post.create(
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
      .put(`/api/posts/${post._id}`)
      .set('Cookie', sessionCookie)
      .send({
        sections: [
          {
            type: POST_SECTION_TYPES.TEXT,
            content: 'some new content instead of old sections',
          },
        ],
      });

    expect(mockRemoveFileByPath.mock.calls[0][0]).toBe(
      '/uploads/test/1724110246594.jpg',
    );
    expect(mockRemoveFileByPath.mock.calls[1][0]).toBe(
      '/uploads/test/1724110246595.jpg',
    );
  });
});
