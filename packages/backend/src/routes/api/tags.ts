import { follow, unfollow } from '@controllers/tags';
import { createApiRouter } from '@libs/api-router';
import { apiRateLimiter } from '@middlewares/rate-limiter';
import { okResponseSchema } from '@validators/common';
import { tagParamsSchema } from '@validators/tags';

const api = createApiRouter({
  prefix: '/tags',
  tag: 'Tags',
  tagDescription: 'Following the tags whose posts belong in your feed',
});

api.put({
  path: '/:tag/follow',
  summary: 'Follow a tag',
  description: 'Posts carrying the tag start appearing in `GET /posts/feed`.',
  auth: true,
  rateLimiter: apiRateLimiter,
  request: { params: tagParamsSchema },
  responses: {
    200: { description: 'The tag is now followed', schema: okResponseSchema },
  },
  handler: follow,
});

api.delete({
  path: '/:tag/follow',
  summary: 'Unfollow a tag',
  auth: true,
  rateLimiter: apiRateLimiter,
  request: { params: tagParamsSchema },
  responses: {
    200: {
      description: 'The tag is no longer followed',
      schema: okResponseSchema,
    },
  },
  handler: unfollow,
});

export default api.router;
