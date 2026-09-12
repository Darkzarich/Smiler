import { z } from 'zod';
import { POST_MAX_TAG_LEN } from '@constants/index';
import { ERRORS } from '@errors';

export const tagParamsSchema = z.object({
  tag: z
    .string()
    .max(POST_MAX_TAG_LEN, ERRORS.POST_TAG_MAX_LEN_EXCEEDED)
    .describe('The tag to follow or unfollow'),
});

export type TagParams = z.infer<typeof tagParamsSchema>;
