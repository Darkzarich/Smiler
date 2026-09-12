import {
  all,
  blowing,
  create,
  deleteById,
  getBySlug,
  getFeed,
  getListByAuthor,
  recent,
  search,
  today,
  topThisWeek,
  unvoteById,
  upload,
  uploadByUrl,
  updateById,
  voteById,
} from '@controllers/posts';
import { createApiRouter } from '@libs/api-router';
import {
  apiRateLimiter,
  uploadRateLimiter,
  voteRateLimiter,
  writeRateLimiter,
} from '@middlewares/rate-limiter';
import { okResponseSchema, voteBodySchema } from '@validators/common';
import {
  cursorPostListSchema,
  externalImageBodySchema,
  postCreateBodySchema,
  postFeedQuerySchema,
  postIdParamsSchema,
  postIndexQuerySchema,
  postListQuerySchema,
  postListSchema,
  postPictureSectionSchema,
  postSchema,
  postSlugParamsSchema,
  postUpdateBodySchema,
  storedPostSchema,
} from '@validators/posts';

const api = createApiRouter({
  prefix: '/posts',
  tag: 'Posts',
  tagDescription: 'Reading, writing and voting on posts',
});

const postListResponse = {
  200: { description: 'One page of posts', schema: postListSchema },
};

const cursorPostListResponse = {
  200: {
    description: 'One page of posts, newest first',
    schema: cursorPostListSchema,
  },
};

const voteResponses = {
  200: {
    description: 'The post with its new rating',
    schema: storedPostSchema,
  },
  403: {
    description: 'Your own post, or one you have already voted on',
  },
  404: { description: 'No such post' },
};

api.get({
  path: '/',
  summary: "Search posts, or list one author's posts",
  description:
    "With `author`, lists that author's posts newest first. Without it, searches every post by title, date, rating and tags, highest rated first.",
  rateLimiter: apiRateLimiter,
  request: { query: postIndexQuerySchema },
  responses: {
    ...cursorPostListResponse,
    404: { description: 'No author with that login' },
  },
  handler: (req, res) => {
    if (req.query.author) {
      return getListByAuthor(req, res);
    }

    return search(req, res);
  },
});

api.post({
  path: '/',
  summary: 'Create a post',
  description:
    "Clears the author's saved template: the post it was a draft of now exists.",
  auth: true,
  rateLimiter: writeRateLimiter,
  request: { body: postCreateBodySchema },
  responses: {
    200: { description: 'The post that was created', schema: postSchema },
  },
  handler: create,
});

// The category paths are registered before `/:slug` so that a category is not
// read as the slug of a post.
api.get({
  path: '/categories/all',
  summary: 'Every post, highest rated first',
  rateLimiter: apiRateLimiter,
  request: { query: postListQuerySchema },
  responses: postListResponse,
  handler: all,
});

api.get({
  path: '/categories/today',
  summary: "Today's posts, highest rated first",
  rateLimiter: apiRateLimiter,
  request: { query: postListQuerySchema },
  responses: postListResponse,
  handler: today,
});

api.get({
  path: '/categories/blowing',
  summary: 'Posts gaining rating fast',
  description:
    'Posts from the last hour that have already passed the rating threshold.',
  rateLimiter: apiRateLimiter,
  request: { query: postListQuerySchema },
  responses: postListResponse,
  handler: blowing,
});

api.get({
  path: '/categories/recent',
  summary: 'Posts from the last two hours, newest first',
  rateLimiter: apiRateLimiter,
  request: { query: postFeedQuerySchema },
  responses: cursorPostListResponse,
  handler: recent,
});

api.get({
  path: '/categories/top-this-week',
  summary: 'This week’s posts, highest rated first',
  rateLimiter: apiRateLimiter,
  request: { query: postListQuerySchema },
  responses: postListResponse,
  handler: topThisWeek,
});

api.get({
  path: '/feed',
  summary: 'The current user’s feed',
  description:
    'Posts carrying a followed tag or written by a followed author, newest first, minus the reader’s own.',
  auth: true,
  rateLimiter: apiRateLimiter,
  request: { query: postFeedQuerySchema },
  responses: cursorPostListResponse,
  handler: getFeed,
});

api.post({
  path: '/upload',
  summary: 'Add an uploaded picture to the post template',
  description:
    'The picture is re-encoded to a bounded jpeg and stored on this server. The section it returns is appended to the current user’s template, ready to be sent back with the post.',
  auth: true,
  rateLimiter: uploadRateLimiter,
  requestBody: {
    required: true,
    content: {
      'multipart/form-data': {
        schema: {
          type: 'object',
          required: ['picture'],
          properties: {
            picture: {
              type: 'string',
              format: 'binary',
              description: 'A jpg, jpeg, png, gif, webp or avif picture',
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: 'The picture section that was added',
      schema: postPictureSectionSchema,
    },
    404: { description: 'The session points at a user that no longer exists' },
    413: { description: 'The picture is larger than the upload limit' },
    422: { description: 'The file is not a picture of a supported type' },
  },
  handler: upload,
});

api.post({
  path: '/upload/url',
  summary: 'Add a picture from a url to the post template',
  description:
    'The url is only a source: the picture is downloaded, re-encoded and stored here, and the section that comes back points at this server. Addresses on the local network are refused.',
  auth: true,
  rateLimiter: uploadRateLimiter,
  request: { body: externalImageBodySchema },
  responses: {
    200: {
      description: 'The picture section that was added',
      schema: postPictureSectionSchema,
    },
    404: { description: 'The session points at a user that no longer exists' },
    413: {
      description: 'The template already holds the most sections allowed',
    },
  },
  handler: uploadByUrl,
});

api.get({
  path: '/:slug',
  summary: 'Read one post',
  rateLimiter: apiRateLimiter,
  request: { params: postSlugParamsSchema },
  responses: {
    200: { description: 'The post', schema: postSchema },
    404: { description: 'No post with that slug' },
  },
  handler: getBySlug,
});

api.put({
  path: '/:id',
  summary: 'Edit a post',
  description:
    'Only the author, and only for a while after it was written. Pictures dropped from the post are deleted from the server.',
  auth: true,
  rateLimiter: writeRateLimiter,
  request: { params: postIdParamsSchema, body: postUpdateBodySchema },
  responses: {
    200: { description: 'The post as it now stands', schema: postSchema },
    403: { description: 'Not your post, or the edit window has closed' },
    404: { description: 'No such post' },
  },
  handler: updateById,
});

api.delete({
  path: '/:id',
  summary: 'Delete a post',
  description:
    'Only the author, only within the same window as editing, and only while nobody has commented. The author’s rating is rolled back with it.',
  auth: true,
  rateLimiter: writeRateLimiter,
  request: { params: postIdParamsSchema },
  responses: {
    200: { description: 'The post is gone', schema: okResponseSchema },
    403: {
      description:
        'Not your post, the window has closed, or it already has comments',
    },
    404: { description: 'No such post' },
  },
  handler: deleteById,
});

api.put({
  path: '/:id/vote',
  summary: 'Vote on a post',
  description:
    'An existing vote can be flipped to the other direction, which moves the rating by twice the vote.',
  auth: true,
  rateLimiter: voteRateLimiter,
  request: { params: postIdParamsSchema, body: voteBodySchema },
  responses: voteResponses,
  handler: voteById,
});

api.delete({
  path: '/:id/vote',
  summary: 'Take back a vote on a post',
  auth: true,
  rateLimiter: voteRateLimiter,
  request: { params: postIdParamsSchema },
  responses: {
    ...voteResponses,
    403: { description: 'You have not voted on this post' },
  },
  handler: unvoteById,
});

export default api.router;
