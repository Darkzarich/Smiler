import { z } from 'zod';
import { USER_MAX_BIO_LENGTH } from '@constants/index';
import { ERRORS } from '@errors';
import { apiSchema } from '@libs/openapi/registry';
import { normalizeLogin } from '@models/User';
import { authorSchema, imageUrl, isoDateTime, objectId } from './common';
import { postSectionSchema } from './posts';

export const userUpdateBodySchema = apiSchema(
  'UserUpdateBody',
  z.object({
    bio: z
      .string({ error: ERRORS.USER_UPDATE_FIELD_INVALID })
      .max(USER_MAX_BIO_LENGTH, ERRORS.USER_BIO_MAX_LENGTH_EXCEEDED)
      .optional(),
    // The avatar is not a plain field any more: it names a file this server
    // downloaded and stored, so it is set through `PUT /users/me/avatar`.
  }),
);

export const avatarBodySchema = apiSchema(
  'AvatarBody',
  z.object({ url: imageUrl(ERRORS.USER_AVATAR_URL_REQUIRED) }),
);

export const userLoginParamsSchema = z.object({
  login: z
    .string()
    .transform(normalizeLogin)
    .describe("The user's login, as shown on their profile"),
});

export const userIdParamsSchema = z.object({ id: objectId() });

export const templateSectionParamsSchema = z.object({
  hash: z.string().describe('The hash of the section holding the picture'),
});

export const userProfileSchema = apiSchema(
  'UserProfile',
  z.object({
    _id: z.string(),
    login: z.string(),
    rating: z.number(),
    bio: z.string(),
    avatar: z.string(),
    createdAt: isoDateTime(),
    followersAmount: z.number(),
    lastLoginAt: isoDateTime()
      .optional()
      .describe('Absent for users who never signed in since it was tracked'),
    isFollowed: z
      .boolean()
      .optional()
      .describe('Absent when the profile is the current user’s own'),
  }),
);

export const userUpdateResponseSchema = apiSchema(
  'User',
  z.object({
    _id: z.string(),
    login: z.string(),
    rating: z.number(),
    bio: z.string(),
    avatar: z.string(),
    createdAt: isoDateTime(),
    followersAmount: z.number(),
  }),
);

export const userSettingsSchema = apiSchema(
  'UserSettings',
  z.object({
    authors: z.array(authorSchema).describe('The users being followed'),
    tags: z.array(z.string()).describe('The tags being followed'),
    bio: z.string(),
    avatar: z.string(),
  }),
);

export const avatarResponseSchema = apiSchema(
  'Avatar',
  z.object({ avatar: z.string().describe('Where the stored picture lives') }),
);

/** The post a user is part way through writing, kept server side so it
 * survives a reload. */
export const postTemplateSchema = apiSchema(
  'PostTemplate',
  z.object({
    title: z.string(),
    tags: z.array(z.string()),
    sections: z.array(postSectionSchema),
  }),
);

export type UserIdParams = z.infer<typeof userIdParamsSchema>;
export type UserLoginParams = z.infer<typeof userLoginParamsSchema>;
export type TemplateSectionParams = z.infer<typeof templateSectionParamsSchema>;
export type UserUpdateBody = z.infer<typeof userUpdateBodySchema>;
export type AvatarBody = z.infer<typeof avatarBodySchema>;
