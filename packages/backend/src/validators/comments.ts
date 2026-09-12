import { z } from 'zod';
import { COMMENT_MAX_BODY_LENGTH, COMMENT_MAX_LIMIT } from '@constants/index';
import { ERRORS } from '@errors';
import { apiSchema } from '@libs/openapi/registry';
import sanitizeHtml, {
  hasSanitizedHtmlContent,
  SanitizeHtmlProfile,
} from '@libs/sanitize-html';
import {
  authorSchema,
  isoDateTime,
  listQuery,
  objectId,
  okResponseSchema,
  paginationResponseFields,
  ratedSchema,
} from './common';

/** How many comments a page holds by default — a thread reads better a few at
 * a time than all at once. */
const COMMENT_DEFAULT_LIMIT = 10;

/** The length limit is on what the client sent, not on what survives
 * sanitizing, so the same comment is accepted or rejected either way. */
const commentBody = z
  .string({ error: ERRORS.COMMENT_SHOULD_NOT_BE_EMPTY })
  .min(1, ERRORS.COMMENT_SHOULD_NOT_BE_EMPTY)
  .max(COMMENT_MAX_BODY_LENGTH, ERRORS.COMMENT_BODY_MAX_LENGTH_EXCEEDED)
  .transform((body) => sanitizeHtml(body, SanitizeHtmlProfile.Comment))
  .refine(
    (body) => hasSanitizedHtmlContent(body),
    ERRORS.COMMENT_SHOULD_NOT_BE_EMPTY,
  )
  .meta({ maxLength: COMMENT_MAX_BODY_LENGTH })
  .describe('Rich text; sanitized before it is stored');

export const commentCreateBodySchema = apiSchema(
  'CommentCreateBody',
  z.object({
    body: commentBody,
    post: objectId(ERRORS.POST_ID_REQUIRED).describe(
      'The post being commented on',
    ),
    parent: objectId()
      .optional()
      .describe('The comment being replied to, for a nested reply'),
  }),
);

export const commentUpdateBodySchema = apiSchema(
  'CommentUpdateBody',
  z.object({ body: commentBody }),
);

export const commentIdParamsSchema = z.object({ id: objectId() });

export const commentListQuerySchema = listQuery(
  {
    post: objectId(ERRORS.POST_ID_REQUIRED).describe(
      'Whose comments to list — required',
    ),
    author: objectId().optional().describe('Only the comments this user wrote'),
  },
  {
    maxLimit: COMMENT_MAX_LIMIT,
    defaultLimit: COMMENT_DEFAULT_LIMIT,
    maxLimitError: ERRORS.COMMENT_LIMIT_PARAM_EXCEEDED,
  },
);

const commentFields = {
  _id: z.string(),
  parent: z.string().optional(),
  createdAt: isoDateTime(),
  /** A deleted comment keeps its place in the tree so the replies under it
   * still have somewhere to hang, and carries nothing else. */
  deleted: z.boolean(),
  body: z.string().optional(),
  author: authorSchema.nullable().optional(),
  rating: z.number().optional(),
  rated: ratedSchema.optional(),
};

/** Comments nest, so the schema has to refer to itself — which needs the type
 * spelled out rather than inferred. */
type CommentNode = z.infer<z.ZodObject<typeof commentFields>> & {
  children: CommentNode[];
};

export const commentSchema: z.ZodType<CommentNode> = apiSchema(
  'Comment',
  z.object({
    ...commentFields,
    get children() {
      return z.array(commentSchema);
    },
  }),
);

/** A comment as the vote endpoints return it: the stored document, with only
 * what the query happened to populate expanded. */
export const storedCommentSchema = apiSchema(
  'StoredComment',
  z.object({
    _id: z.string(),
    body: z.string(),
    post: z.string(),
    parent: z.string().optional(),
    author: z
      .union([z.string(), authorSchema])
      .describe('An id, or the author expanded where the query populates it'),
    children: z.array(z.unknown()),
    rating: z.number(),
    deleted: z.boolean().optional(),
    createdAt: isoDateTime(),
    updatedAt: isoDateTime(),
  }),
);

/** Deleting a comment with replies empties it instead of removing it, and the
 * emptied comment comes back so the client can redraw the tree. */
export const commentDeleteResultSchema = apiSchema(
  'CommentDeleteResult',
  z.union([okResponseSchema, commentSchema]),
);

export const commentListSchema = apiSchema(
  'CommentList',
  z.object({
    comments: z.array(commentSchema),
    ...paginationResponseFields,
  }),
);

export type CommentIdParams = z.infer<typeof commentIdParamsSchema>;
export type CommentCreateBody = z.infer<typeof commentCreateBodySchema>;
export type CommentUpdateBody = z.infer<typeof commentUpdateBodySchema>;
export type CommentListQuery = z.infer<typeof commentListQuerySchema>;
