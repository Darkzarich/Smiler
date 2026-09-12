import { z } from 'zod';
import { nanoid } from 'nanoid';
import {
  ALLOWED_PICTURE_EXTENSIONS,
  BASE_UPLOAD_FOLDER,
  POST_MAX_LIMIT,
  POST_MAX_TAGS,
  POST_MAX_TAG_LEN,
  POST_SECTIONS_MAX,
  POST_SECTIONS_MAX_LENGTH,
  POST_TITLE_MAX_LENGTH,
} from '@constants/index';
import { ERRORS, ValidationError } from '@errors';
import { apiSchema } from '@libs/openapi/registry';
import sanitizeHtml, {
  hasSanitizedHtmlContent,
  SanitizeHtmlProfile,
} from '@libs/sanitize-html';
import { POST_SECTION_TYPES, type PostSection } from '@models/Post';
import { isValidExternalImageUrl } from '@utils/is-valid-external-image-url';
import { isValidVideoUrl } from '@utils/is-valid-video-url';
import {
  authorSchema,
  cursorListQuery,
  cursorPaginationResponseFields,
  imageUrl,
  isoDateTime,
  listQuery,
  objectId,
  paginationResponseFields,
  queryDate,
  ratedSchema,
} from './common';

/** Long enough to tell the sections of one post apart, short enough to read. */
const SECTION_HASH_LENGTH = 4;

/** A picture the user uploaded lives under the folder of the user who owns it.
 * The folder is checked against the session in `assertOwnUploadedPictures` —
 * here only the shape is, so that nothing else can be passed off as a stored
 * file. */
// eslint-disable-next-line security/detect-non-literal-regexp
const UPLOADED_PICTURE_PATTERN = new RegExp(
  `^${BASE_UPLOAD_FOLDER}/[0-9a-f]{24}/[\\w.-]+\\.(${ALLOWED_PICTURE_EXTENSIONS.join('|')})$`,
  'i',
);

const title = z
  .string({ error: ERRORS.POST_TITLE_REQUIRED })
  .min(1, ERRORS.POST_TITLE_REQUIRED)
  .max(POST_TITLE_MAX_LENGTH, ERRORS.POST_TITLE_MAX_LENGTH_EXCEEDED);

/** Tags are matched against each other, so they are folded to one spelling
 * before they are stored: lowercase, no punctuation, single spaces. */
function normalizeTag(tag: string) {
  return tag
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, '')
    .replace(/\s+/g, ' ');
}

const tags = z
  .array(
    z
      .string({ error: ERRORS.POST_TAG_INVALID })
      .transform(normalizeTag)
      .pipe(
        z
          .string()
          .min(1, ERRORS.POST_TAG_INVALID)
          .max(POST_MAX_TAG_LEN, ERRORS.POST_TAG_MAX_LEN_EXCEEDED),
      ),
    { error: ERRORS.POST_TAG_INVALID },
  )
  // Before the duplicates are dropped: eight tags that fold to the same one are
  // still eight tags the client sent.
  .max(POST_MAX_TAGS, ERRORS.POST_MAX_TAGS_EXCEEDED)
  .transform((values) => Array.from(new Set(values)))
  .meta({ maxItems: POST_MAX_TAGS });

interface SectionOptions {
  /** Whether a text section has to say something. A post does; a draft saved
   * as the user types does not. */
  requireContent: boolean;
}

/** Rich text arrives from the editor and is rendered back as HTML, so what is
 * stored is the sanitized version — never what was sent. */
function textSectionContent({ requireContent }: SectionOptions) {
  const sanitized = z
    .string({ error: ERRORS.POST_TEXT_SECTION_CONTENT_REQUIRED })
    .transform((content) => sanitizeHtml(content, SanitizeHtmlProfile.Post))
    .transform((content, ctx) => {
      if (hasSanitizedHtmlContent(content, { allowHorizontalRule: true })) {
        return content;
      }

      // Markup that sanitizes down to nothing (`<script>`, an empty paragraph)
      // is an empty section, whatever it looked like on the way in.
      if (requireContent) {
        ctx.issues.push({
          code: 'custom',
          message: ERRORS.POST_TEXT_SECTION_CONTENT_REQUIRED,
          input: content,
        });

        return z.NEVER;
      }

      return '';
    });

  if (requireContent) {
    return sanitized;
  }

  return z.preprocess((content) => content ?? '', sanitized);
}

const sectionBaseShape = {
  /** Assigned by the server. A client may send one back and keeps it as long as
   * it still looks like one, so that reordering a post does not renumber its
   * sections. */
  hash: z.string().optional().meta({ maxLength: SECTION_HASH_LENGTH }),
  isSpoiler: z
    .boolean()
    .optional()
    .describe('Renders the section behind a veil the reader has to lift'),
};

function textSectionSchema(options: SectionOptions) {
  return z.object({
    type: z.literal(POST_SECTION_TYPES.TEXT),
    content: textSectionContent(options),
    ...sectionBaseShape,
  });
}

const pictureSectionSchema = z
  .object({
    type: z.literal(POST_SECTION_TYPES.PICTURE),
    url: z
      .string({ error: ERRORS.POST_PIC_SECTION_URL_REQUIRED })
      .min(1, ERRORS.POST_PIC_SECTION_URL_REQUIRED),
    isFile: z
      .boolean()
      .optional()
      .describe('Set by the upload endpoints for a picture stored here'),
    ...sectionBaseShape,
  })
  .check((ctx) => {
    const { url, isFile } = ctx.value;

    const isValid = isFile
      ? UPLOADED_PICTURE_PATTERN.test(url)
      : isValidExternalImageUrl(url);

    if (!isValid) {
      ctx.issues.push({
        code: 'custom',
        message: ERRORS.POST_PIC_SECTION_URL_INVALID,
        input: url,
        path: ['url'],
      });
    }
  });

const videoSectionSchema = z.object({
  type: z.literal(POST_SECTION_TYPES.VIDEO),
  url: z
    .string({ error: ERRORS.POST_VIDEO_SECTION_URL_REQUIRED })
    .refine(isValidVideoUrl, ERRORS.POST_VIDEO_SECTION_URL_REQUIRED),
  ...sectionBaseShape,
});

/** A section as the schemas above parse it, before the server fills in what it
 * owns. */
type ParsedSection = {
  hash?: string;
  isSpoiler?: boolean;
} & (
  | { type: POST_SECTION_TYPES.TEXT; content: string }
  | { type: POST_SECTION_TYPES.PICTURE; url: string; isFile?: boolean }
  | { type: POST_SECTION_TYPES.VIDEO; url: string }
);

/**
 * What the server owns about a section: the hash it is addressed by, and an
 * `isSpoiler` that is either `true` or absent — a stored `false` would be one
 * more thing every reader of a section has to know to ignore.
 *
 * Written out per type rather than by spreading the rest of the object, so that
 * the result is a `PostSection` the compiler recognizes as one.
 */
function normalizeSection(section: ParsedSection): PostSection {
  const hash =
    section.hash?.length === SECTION_HASH_LENGTH
      ? section.hash
      : nanoid(SECTION_HASH_LENGTH);
  const spoiler = section.isSpoiler ? { isSpoiler: true } : {};

  if (section.type === POST_SECTION_TYPES.TEXT) {
    return { type: section.type, content: section.content, hash, ...spoiler };
  }

  if (section.type === POST_SECTION_TYPES.PICTURE) {
    return {
      type: section.type,
      url: section.url,
      ...(section.isFile !== undefined && { isFile: section.isFile }),
      hash,
      ...spoiler,
    };
  }

  return { type: section.type, url: section.url, hash, ...spoiler };
}

function sectionSchema(options: SectionOptions) {
  return z
    .discriminatedUnion(
      'type',
      [textSectionSchema(options), pictureSectionSchema, videoSectionSchema],
      { error: ERRORS.POST_UNSUPPORTED_SECTION_TYPE },
    )
    .transform(normalizeSection);
}

function totalTextLength(sections: unknown[]) {
  return sections.reduce<number>((total, section) => {
    const content =
      typeof section === 'object' && section !== null
        ? (section as { content?: unknown }).content
        : undefined;

    return typeof content === 'string' ? total + content.length : total;
  }, 0);
}

/**
 * The two limits that are about the sections as a whole rather than about any
 * one of them. Both are checked against what the client sent, before the text
 * is sanitized: how much a post is allowed to hold should not depend on how
 * much of its markup survives sanitizing.
 */
function sectionsSchema(options: SectionOptions) {
  return z
    .preprocess(
      (sections, ctx) => {
        if (!Array.isArray(sections)) {
          return sections;
        }

        if (sections.length > POST_SECTIONS_MAX) {
          ctx.issues.push({
            code: 'custom',
            message: ERRORS.POST_SECTIONS_MAX_EXCEEDED,
            input: sections,
          });
        } else if (totalTextLength(sections) > POST_SECTIONS_MAX_LENGTH) {
          ctx.issues.push({
            code: 'custom',
            message: ERRORS.POST_SECTIONS_MAX_LENGTH_EXCEEDED,
            input: sections,
          });
        }

        return sections;
      },
      z.array(sectionSchema(options), { error: ERRORS.POST_SECTIONS_REQUIRED }),
    )
    .meta({ maxItems: POST_SECTIONS_MAX });
}

const postSections = sectionsSchema({ requireContent: true });

const templateSections = sectionsSchema({ requireContent: false });

/**
 * An uploaded picture must live in the uploads folder of the user the post
 * belongs to, otherwise a post could claim (and hotlink) someone else's file.
 *
 * Which user that is only becomes known once the session has been read, so this
 * is the one rule about a section that cannot live in the schema.
 */
export function assertOwnUploadedPictures(
  sections: PostSection[],
  userId: string,
) {
  const ownFolder = `${BASE_UPLOAD_FOLDER}/${userId}/`;

  const stolen = sections.some(
    (section) =>
      section.type === POST_SECTION_TYPES.PICTURE &&
      section.isFile &&
      !section.url.startsWith(ownFolder),
  );

  if (stolen) {
    throw new ValidationError(ERRORS.POST_PIC_SECTION_URL_INVALID);
  }
}

export const postCreateBodySchema = apiSchema(
  'PostCreateBody',
  z.object({
    title,
    sections: postSections
      .refine((sections) => sections.length > 0, ERRORS.POST_SECTIONS_REQUIRED)
      .describe('At least one section, in the order they are shown'),
    tags: tags.default([]),
  }),
);

/** Only what the client means to change. Anything left out keeps the value the
 * post already has. */
export const postUpdateBodySchema = apiSchema(
  'PostUpdateBody',
  z.object({
    title: title.optional(),
    sections: postSections
      .refine((sections) => sections.length > 0, ERRORS.POST_SECTIONS_REQUIRED)
      .optional(),
    tags: tags.optional(),
  }),
);

export const postTemplateBodySchema = apiSchema(
  'PostTemplateBody',
  z.object({
    title: title.optional(),
    sections: templateSections.optional(),
    tags: tags.optional(),
  }),
);

export const externalImageBodySchema = apiSchema(
  'ExternalImageBody',
  z.object({ url: imageUrl(ERRORS.EXTERNAL_IMAGE_URL_REQUIRED) }),
);

export const postIdParamsSchema = z.object({ id: objectId() });

export const postSlugParamsSchema = z.object({
  slug: z.string().describe("The post's url slug"),
});

export const postListQuerySchema = listQuery({}, { maxLimit: POST_MAX_LIMIT });

export const postFeedQuerySchema = cursorListQuery(
  {},
  { maxLimit: POST_MAX_LIMIT },
);

/**
 * `GET /posts` serves two lists: one author's posts when `author` is given, and
 * a search over every post otherwise. They are one endpoint, so they are one
 * query — with the one rule that tells them apart: only the author's list is
 * sorted by date of creation, and only a list sorted that way can be walked by
 * cursor.
 */
export const postIndexQuerySchema = cursorListQuery(
  {
    author: z
      .string()
      .optional()
      .describe("A login — lists that author's posts instead of searching"),
    title: z
      .string()
      .max(POST_TITLE_MAX_LENGTH, ERRORS.POST_TITLE_MAX_LENGTH_EXCEEDED)
      .optional()
      .describe('Matched against post titles through a text index'),
    dateFrom: queryDate(ERRORS.POST_SEARCH_INVALID_DATE).optional(),
    dateTo: queryDate(ERRORS.POST_SEARCH_INVALID_DATE).optional(),
    ratingFrom: z.coerce.number({ error: ERRORS.RATING_INVALID }).optional(),
    ratingTo: z.coerce.number({ error: ERRORS.RATING_INVALID }).optional(),
    // TODO: Fix how frontend sends tags, maybe with QS library
    'tags[]': z
      .union([z.string(), z.array(z.string())])
      .transform((value) => (Array.isArray(value) ? value : [value]))
      .default([])
      .describe('Repeat the parameter to filter by more than one tag'),
  },
  { maxLimit: POST_MAX_LIMIT },
).check((ctx) => {
  if (ctx.value.cursor && !ctx.value.author) {
    ctx.issues.push({
      code: 'custom',
      message: ERRORS.PAGINATION_CURSOR_NOT_SUPPORTED,
      input: ctx.value,
      path: ['cursor'],
    });
  }
});

/** A section as it comes back, once the server has filled in what it owns. */
export const postSectionSchema = apiSchema(
  'PostSection',
  z.discriminatedUnion('type', [
    z.object({
      type: z.literal(POST_SECTION_TYPES.TEXT),
      content: z.string(),
      hash: z.string(),
      isSpoiler: z.literal(true).optional(),
    }),
    z.object({
      type: z.literal(POST_SECTION_TYPES.PICTURE),
      url: z.string(),
      isFile: z.boolean().optional(),
      hash: z.string(),
      isSpoiler: z.literal(true).optional(),
    }),
    z.object({
      type: z.literal(POST_SECTION_TYPES.VIDEO),
      url: z.string(),
      hash: z.string(),
      isSpoiler: z.literal(true).optional(),
    }),
  ]),
);

export const postPictureSectionSchema = apiSchema(
  'PostPictureSection',
  z.object({
    type: z.literal(POST_SECTION_TYPES.PICTURE),
    url: z.string(),
    isFile: z.literal(true),
    hash: z.string(),
  }),
);

export const postSchema = apiSchema(
  'Post',
  z.object({
    _id: z.string(),
    title: z.string(),
    slug: z.string(),
    sections: z.array(postSectionSchema),
    author: authorSchema.nullable(),
    tags: z.array(z.string()),
    rating: z.number(),
    commentCount: z.number(),
    createdAt: isoDateTime(),
    rated: ratedSchema,
  }),
);

export const postListSchema = apiSchema(
  'PostList',
  z.object({ posts: z.array(postSchema), ...paginationResponseFields }),
);

/** The lists sorted by date of creation hand back where the next page starts,
 * so that posts landing mid-scroll cannot shift the page boundaries. */
export const cursorPostListSchema = apiSchema(
  'CursorPostList',
  z.object({ posts: z.array(postSchema), ...cursorPaginationResponseFields }),
);

/** A post as the vote endpoints return it: the stored document, without the
 * author expanded and without the vote state of the caller. */
export const storedPostSchema = apiSchema(
  'StoredPost',
  z.object({
    _id: z.string(),
    title: z.string(),
    slug: z.string(),
    author: z.string().describe('The author id, not expanded'),
    sections: z.array(postSectionSchema),
    tags: z.array(z.string()),
    rating: z.number(),
    commentCount: z.number(),
    createdAt: isoDateTime(),
    updatedAt: isoDateTime(),
  }),
);

export type PostIdParams = z.infer<typeof postIdParamsSchema>;
export type PostSlugParams = z.infer<typeof postSlugParamsSchema>;
export type PostCreateBody = z.infer<typeof postCreateBodySchema>;
export type PostUpdateBody = z.infer<typeof postUpdateBodySchema>;
export type PostTemplateBody = z.infer<typeof postTemplateBodySchema>;
export type PostIndexQuery = z.infer<typeof postIndexQuerySchema>;
export type PostListQuery = z.infer<typeof postListQuerySchema>;
export type PostFeedQuery = z.infer<typeof postFeedQuerySchema>;
export type ExternalImageBody = z.infer<typeof externalImageBodySchema>;
