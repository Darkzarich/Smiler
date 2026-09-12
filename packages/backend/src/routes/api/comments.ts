import {
  create,
  deleteById,
  getList,
  unvoteById,
  updateById,
  voteById,
} from '@controllers/comments';
import { createApiRouter } from '@libs/api-router';
import {
  apiRateLimiter,
  voteRateLimiter,
  writeRateLimiter,
} from '@middlewares/rate-limiter';
import { voteBodySchema } from '@validators/common';
import {
  commentCreateBodySchema,
  commentDeleteResultSchema,
  commentIdParamsSchema,
  commentListQuerySchema,
  commentListSchema,
  commentSchema,
  commentUpdateBodySchema,
  storedCommentSchema,
} from '@validators/comments';

const api = createApiRouter({
  prefix: '/comments',
  tag: 'Comments',
  tagDescription: 'Reading, writing and voting on the comments of a post',
});

const voteResponses = {
  200: {
    description: 'The comment with its new rating',
    schema: storedCommentSchema,
  },
  403: { description: 'Your own comment, or one you have already voted on' },
  404: { description: 'No such comment' },
};

api.get({
  path: '/',
  summary: 'List the comments of a post',
  description:
    'The comments come back as a tree: every comment carries its replies in `children`, so one request is enough to render a thread.',
  rateLimiter: apiRateLimiter,
  request: { query: commentListQuerySchema },
  responses: {
    200: {
      description: 'One page of top level comments',
      schema: commentListSchema,
    },
    404: { description: 'No user with that id, when `author` is given' },
  },
  handler: getList,
});

api.post({
  path: '/',
  summary: 'Write a comment',
  description: 'With `parent`, the comment is a reply to that comment.',
  auth: true,
  rateLimiter: writeRateLimiter,
  request: { body: commentCreateBodySchema },
  responses: {
    200: { description: 'The comment that was written', schema: commentSchema },
    404: { description: 'No such post, or no such parent comment in it' },
  },
  handler: create,
});

api.put({
  path: '/:id',
  summary: 'Edit a comment',
  description:
    'Only the author, only for a while after writing it, and only while nobody has replied.',
  auth: true,
  rateLimiter: writeRateLimiter,
  request: { params: commentIdParamsSchema, body: commentUpdateBodySchema },
  responses: {
    200: { description: 'The comment as it now stands', schema: commentSchema },
    400: { description: 'Somebody has already replied to it' },
    403: { description: 'Not your comment, or the edit window has closed' },
    404: { description: 'No such comment' },
  },
  handler: updateById,
});

api.delete({
  path: '/:id',
  summary: 'Delete a comment',
  description:
    'A comment with replies is emptied rather than removed, so the replies under it keep their place in the tree.',
  auth: true,
  rateLimiter: writeRateLimiter,
  request: { params: commentIdParamsSchema },
  responses: {
    200: {
      description:
        'The comment is gone — or, when it had replies, the emptied comment',
      schema: commentDeleteResultSchema,
    },
    403: { description: 'Not your comment, or the window has closed' },
    404: { description: 'No such comment' },
  },
  handler: deleteById,
});

api.put({
  path: '/:id/vote',
  summary: 'Vote on a comment',
  auth: true,
  rateLimiter: voteRateLimiter,
  request: { params: commentIdParamsSchema, body: voteBodySchema },
  responses: voteResponses,
  handler: voteById,
});

api.delete({
  path: '/:id/vote',
  summary: 'Take back a vote on a comment',
  auth: true,
  rateLimiter: voteRateLimiter,
  request: { params: commentIdParamsSchema },
  responses: {
    ...voteResponses,
    403: { description: 'You have not voted on this comment' },
  },
  handler: unvoteById,
});

export default api.router;
