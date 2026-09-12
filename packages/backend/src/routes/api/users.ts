import {
  deleteMyAvatar,
  deletePostTemplatePicture,
  followById,
  getByLogin,
  getMyPostTemplate,
  getSettings,
  unfollowById,
  updateMe,
  updateMyAvatar,
  updateMyPostTemplate,
} from '@controllers/users';
import { createApiRouter } from '@libs/api-router';
import { apiRateLimiter, uploadRateLimiter } from '@middlewares/rate-limiter';
import { okResponseSchema } from '@validators/common';
import { postTemplateBodySchema } from '@validators/posts';
import {
  avatarBodySchema,
  avatarResponseSchema,
  postTemplateSchema,
  templateSectionParamsSchema,
  userIdParamsSchema,
  userLoginParamsSchema,
  userProfileSchema,
  userSettingsSchema,
  userUpdateBodySchema,
  userUpdateResponseSchema,
} from '@validators/users';

const api = createApiRouter({
  prefix: '/users',
  tag: 'Users',
  tagDescription: 'Profiles, settings, avatars and the saved post template',
});

api.get({
  path: '/:login',
  summary: 'Read a user profile',
  description:
    'Carries `isFollowed` when the profile belongs to somebody other than the reader.',
  rateLimiter: apiRateLimiter,
  request: { params: userLoginParamsSchema },
  responses: {
    200: { description: 'The profile', schema: userProfileSchema },
    404: { description: 'No user with that login' },
  },
  handler: getByLogin,
});

api.put({
  path: '/me',
  summary: 'Update the current user',
  description:
    'Only the fields listed here can be set. The avatar has an endpoint of its own, because it names a file this server stores.',
  auth: true,
  rateLimiter: apiRateLimiter,
  request: { body: userUpdateBodySchema },
  responses: {
    200: {
      description: 'The user as it now stands',
      schema: userUpdateResponseSchema,
    },
  },
  handler: updateMe,
});

api.put({
  path: '/me/avatar',
  summary: "Set the current user's avatar from a url",
  description:
    'Downloads the picture at `url`, re-encodes it to a square jpeg and stores it on this server. The response holds the stored path, not the url that was sent.',
  auth: true,
  rateLimiter: uploadRateLimiter,
  request: { body: avatarBodySchema },
  responses: {
    200: {
      description: 'Where the avatar now lives',
      schema: avatarResponseSchema,
    },
    404: { description: 'The session points at a user that no longer exists' },
    413: { description: 'The picture is larger than the limit' },
  },
  handler: updateMyAvatar,
});

api.delete({
  path: '/me/avatar',
  summary: "Clear the current user's avatar",
  description: 'Falls back to the default avatar and deletes the stored file.',
  auth: true,
  rateLimiter: apiRateLimiter,
  responses: {
    200: { description: 'The avatar was cleared', schema: okResponseSchema },
    404: { description: 'The session points at a user that no longer exists' },
  },
  handler: deleteMyAvatar,
});

api.get({
  path: '/me/template',
  summary: 'Read the saved post template',
  description:
    'The post the current user is part way through writing, kept here so it survives a reload.',
  auth: true,
  rateLimiter: apiRateLimiter,
  responses: {
    200: { description: 'The saved template', schema: postTemplateSchema },
    404: { description: 'The session points at a user that no longer exists' },
  },
  handler: getMyPostTemplate,
});

api.put({
  path: '/me/template',
  summary: 'Save the post template',
  description:
    'Every field is optional: what is left out keeps the value it already had. Text sections may be empty here — a draft is allowed to be unfinished.',
  auth: true,
  rateLimiter: apiRateLimiter,
  request: { body: postTemplateBodySchema },
  responses: {
    200: {
      description: 'The template as it now stands',
      schema: postTemplateSchema,
    },
  },
  handler: updateMyPostTemplate,
});

api.get({
  path: '/me/settings',
  summary: "Read the current user's settings",
  auth: true,
  rateLimiter: apiRateLimiter,
  responses: {
    200: {
      description: 'The bio, avatar, followed authors and followed tags',
      schema: userSettingsSchema,
    },
    404: { description: 'The session points at a user that no longer exists' },
  },
  handler: getSettings,
});

api.put({
  path: '/:id/follow',
  summary: 'Follow a user',
  description: 'Their posts start appearing in `GET /posts/feed`.',
  auth: true,
  rateLimiter: apiRateLimiter,
  request: { params: userIdParamsSchema },
  responses: {
    200: { description: 'The user is now followed', schema: okResponseSchema },
    403: { description: 'Yourself, or somebody you already follow' },
    404: { description: 'No such user' },
  },
  handler: followById,
});

api.delete({
  path: '/:id/follow',
  summary: 'Unfollow a user',
  auth: true,
  rateLimiter: apiRateLimiter,
  request: { params: userIdParamsSchema },
  responses: {
    200: {
      description: 'The user is no longer followed',
      schema: okResponseSchema,
    },
    403: { description: 'Yourself, or somebody you do not follow' },
    404: { description: 'No such user' },
  },
  handler: unfollowById,
});

api.delete({
  path: '/me/template/:hash',
  summary: 'Remove an uploaded picture from the template',
  description:
    'Drops the section and deletes the stored file. Only for sections holding a picture uploaded here.',
  auth: true,
  rateLimiter: apiRateLimiter,
  request: { params: templateSectionParamsSchema },
  responses: {
    200: {
      description: 'The section and its file are gone',
      schema: okResponseSchema,
    },
    400: { description: 'That section does not hold an uploaded picture' },
    404: { description: 'No section with that hash' },
  },
  handler: deletePostTemplatePicture,
});

export default api.router;
