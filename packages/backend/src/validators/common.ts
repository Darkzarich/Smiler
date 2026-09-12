import { z } from 'zod';
import { ERRORS } from '@errors';
import { apiSchema } from '@libs/openapi/registry';
import { decodeCursor, type PageCursor } from '@utils/pagination';

/** Every error this API sends has this shape — see the global error handler. */
export const errorResponseSchema = apiSchema(
  'Error',
  z.object({
    error: z.object({
      code: z
        .string()
        .describe('A stable code for the error, safe to branch on'),
      message: z.string().describe('A message meant for the end user'),
      details: z
        .array(
          z.object({
            path: z
              .string()
              .describe('The field the problem is in, e.g. `sections[0].url`'),
            message: z.string(),
          }),
        )
        .optional()
        .describe('Present on validation errors: every field that failed'),
    }),
  }),
);

/** What an endpoint with nothing to return answers with. */
export const okResponseSchema = apiSchema(
  'OK',
  z.object({ ok: z.literal(true) }),
);

const OBJECT_ID_PATTERN = /^[0-9a-f]{24}$/i;

/** A MongoDB document id. Checking the shape here keeps a malformed id from
 * reaching Mongoose, which would report it as a generic cast error.
 *
 * `missingMessage` is for the ids a request is *about* rather than the ones it
 * points at, where "must be specified" is what the client needs to hear. */
export const objectId = (missingMessage?: string) =>
  z
    .string(missingMessage ? { error: missingMessage } : undefined)
    .regex(OBJECT_ID_PATTERN, ERRORS.INVALID_ID)
    .meta({ examples: ['507f1f77bcf86cd799439011'] });

/** A url pointing at a picture this server should download and re-encode.
 * Where it points is checked when it is fetched — see `fetchExternalImage`. */
export const imageUrl = (missingMessage: string) =>
  z
    .string({ error: missingMessage })
    .trim()
    .min(1, missingMessage)
    .meta({ format: 'uri' })
    .describe('A public http(s) link to the picture to download');

/** A date as a client may send it in a query string — anything `Date` accepts,
 * which includes both `2026-09-12` and a full timestamp. */
export const queryDate = (invalidMessage: string) =>
  z
    .string()
    .transform((raw, ctx) => {
      const date = new Date(raw);

      if (Number.isNaN(date.getTime())) {
        ctx.issues.push({
          code: 'custom',
          message: invalidMessage,
          input: raw,
        });

        return z.NEVER;
      }

      return date;
    })
    .meta({ format: 'date-time' });

/** The shape of a timestamp as it comes back in a response, once serialized. */
export const isoDateTime = () => z.string().meta({ format: 'date-time' });

interface PaginationOptions {
  maxLimit: number;
  defaultLimit?: number;
  /** Lists differ in how many items they will serve at once, and say so in
   * their own words. */
  maxLimitError?: string;
}

function offsetShape({
  maxLimit,
  defaultLimit = maxLimit,
  maxLimitError = ERRORS.POST_LIMIT_PARAM_EXCEEDED,
}: PaginationOptions) {
  return {
    limit: z.coerce
      .number({ error: ERRORS.PAGINATION_INVALID_LIMIT })
      .int(ERRORS.PAGINATION_INVALID_LIMIT)
      .positive(ERRORS.PAGINATION_INVALID_LIMIT)
      .max(maxLimit, maxLimitError)
      .default(defaultLimit)
      .describe('How many items one page holds'),

    offset: z.coerce
      .number({ error: ERRORS.PAGINATION_INVALID_OFFSET })
      .int(ERRORS.PAGINATION_INVALID_OFFSET)
      .min(0, ERRORS.PAGINATION_INVALID_OFFSET)
      .default(0)
      .describe('How many items to skip before the page starts'),
  };
}

/** Opaque to the client on purpose — see `encodeCursor`. */
const cursorField = z
  .string()
  .transform((raw, ctx): PageCursor => {
    const cursor = decodeCursor(raw);

    if (!cursor) {
      ctx.issues.push({
        code: 'custom',
        message: ERRORS.PAGINATION_INVALID_CURSOR,
        input: raw,
      });

      return z.NEVER;
    }

    return cursor;
  })
  .optional()
  .describe(
    'The `nextCursor` of the previous page. Mutually exclusive with `offset`.',
  );

function wasSent(query: unknown, name: string) {
  if (typeof query !== 'object' || query === null) {
    return false;
  }

  return Object.entries(query).some(
    ([key, value]) => key === name && value !== undefined,
  );
}

/**
 * A page of a list that can only be walked by `offset`, because it is sorted by
 * something a vote can change: a cursor over `rating` would skip or repeat
 * posts as votes land between two requests.
 *
 * A `cursor` is rejected rather than ignored, so that a client asking for one
 * finds out instead of quietly paging through a list twice.
 */
export function listQuery<Shape extends z.ZodRawShape>(
  shape: Shape,
  options: PaginationOptions,
) {
  const parsed = z.object({ ...offsetShape(options), ...shape });

  return z.preprocess((query, ctx) => {
    if (wasSent(query, 'cursor')) {
      ctx.issues.push({
        code: 'custom',
        message: ERRORS.PAGINATION_CURSOR_NOT_SUPPORTED,
        input: query,
        path: ['cursor'],
      });
    }

    return query;
  }, parsed);
}

/**
 * A page of a list sorted by date of creation, which can be walked by `cursor`
 * as well as by `offset`.
 *
 * Whether the two were *sent* is what the rule is about, and `offset` falls
 * back to `0` when it was not, so the check runs before the object is parsed.
 */
export function cursorListQuery<Shape extends z.ZodRawShape>(
  shape: Shape,
  options: PaginationOptions,
) {
  const parsed = z.object({
    ...offsetShape(options),
    cursor: cursorField,
    ...shape,
  });

  return z.preprocess((query, ctx) => {
    if (wasSent(query, 'cursor') && wasSent(query, 'offset')) {
      ctx.issues.push({
        code: 'custom',
        message: ERRORS.PAGINATION_CURSOR_WITH_OFFSET,
        input: query,
        path: ['cursor'],
      });
    }

    return query;
  }, parsed);
}

/** What every paginated list answers with, next to its own items. */
export const paginationResponseFields = {
  hasNextPage: z.boolean(),
};

/** What a list served by cursor adds: where the next page starts, or `null` on
 * the last one. */
export const cursorPaginationResponseFields = {
  ...paginationResponseFields,
  nextCursor: z
    .string()
    .nullable()
    .optional()
    .describe(
      'Pass as `cursor` to get the next page — `null` on the last one, absent when the list was served by offset',
    ),
};

/** How an author is embedded in a post or a comment. */
export const authorSchema = apiSchema(
  'Author',
  z.object({
    _id: z.string(),
    login: z.string(),
    avatar: z.string(),
  }),
);

/** Which way the current user voted on the thing being returned, if at all. */
export const ratedSchema = apiSchema(
  'Rated',
  z.object({
    isRated: z.boolean(),
    negative: z.boolean().optional(),
  }),
);

/** Posts and comments are voted on the same way. */
export const voteBodySchema = apiSchema(
  'VoteBody',
  z.object({
    negative: z
      .boolean()
      .default(false)
      .describe('`true` downvotes, `false` upvotes'),
  }),
);

export type VoteBody = z.infer<typeof voteBodySchema>;
