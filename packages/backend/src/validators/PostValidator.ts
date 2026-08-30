import { Post, POST_SECTION_TYPES } from '@models/Post';
import {
  POST_SECTIONS_MAX,
  POST_SECTIONS_MAX_LENGTH,
  POST_TITLE_MAX_LENGTH,
  POST_MAX_TAGS,
  POST_MAX_TAG_LEN,
  ALLOWED_PICTURE_EXTENSIONS,
  ALLOWED_VIDEO_EMBEDS,
  ALLOWED_VIDEO_EXTENSIONS,
  BASE_UPLOAD_FOLDER,
} from '@constants/index';
import { ValidationError, ERRORS } from '@errors';
import sanitizeHtml, {
  hasSanitizedHtmlContent,
  SanitizeHtmlProfile,
} from '@libs/sanitize-html';
import { nanoid } from 'nanoid';
import { isValidExternalImageUrl } from '@utils/is-valid-external-image-url';
import { ALLOWED_URL_PROTOCOLS, isPrivateHost } from '@utils/is-private-host';

const allowedSectionTypes = Object.values(POST_SECTION_TYPES);

// eslint-disable-next-line security/detect-non-literal-regexp
const UPLOADED_FILE_NAME_REGEXP = new RegExp(
  `^[\\w.-]+\\.(${ALLOWED_PICTURE_EXTENSIONS.join('|')})$`,
  'i',
);

type PostValidationInput = Partial<{
  title: string;
  sections: Post['sections'];
  tags: unknown;
}>;

export class PostValidator {
  /** Validate title length */
  private static validateTitle(title: string) {
    if (title.length > POST_TITLE_MAX_LENGTH) {
      throw new ValidationError(ERRORS.POST_TITLE_MAX_LENGTH_EXCEEDED);
    }
  }

  private static normalizeTag(tag: string) {
    return tag
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s]+/g, '')
      .replace(/\s+/g, ' ');
  }

  /** Validate tags count and return normalized unique tags */
  private static validateAndPrepareTags(tags: unknown) {
    if (!Array.isArray(tags)) {
      throw new ValidationError(ERRORS.POST_TAG_INVALID);
    }

    if (tags.length > POST_MAX_TAGS) {
      throw new ValidationError(ERRORS.POST_MAX_TAGS_EXCEEDED);
    }

    const normalizedTags = tags.map((tag) => {
      if (typeof tag !== 'string') {
        throw new ValidationError(ERRORS.POST_TAG_INVALID);
      }

      const normalizedTag = PostValidator.normalizeTag(tag);

      if (!normalizedTag) {
        throw new ValidationError(ERRORS.POST_TAG_INVALID);
      }

      return normalizedTag;
    });

    if (normalizedTags.some((tag) => tag.length > POST_MAX_TAG_LEN)) {
      throw new ValidationError(ERRORS.POST_TAG_MAX_LEN_EXCEEDED);
    }

    return Array.from(new Set(normalizedTags));
  }

  /** An uploaded picture must live in the uploads folder of the user the post
   * belongs to, otherwise a post could claim (and hotlink) someone else's file.
   */
  private static isValidUploadedFileUrl(url: string, userId: string) {
    const userUploadFolder = `${BASE_UPLOAD_FOLDER}/${userId}/`;

    if (!url.startsWith(userUploadFolder) || url.includes('..')) {
      return false;
    }

    return UPLOADED_FILE_NAME_REGEXP.test(url.slice(userUploadFolder.length));
  }

  private static isValidVideoUrl(urlString: string): boolean {
    try {
      const url = new URL(urlString);
      if (!ALLOWED_URL_PROTOCOLS.includes(url.protocol)) return false;

      // Block localhost, private IPs (SSRF protection)
      const { hostname } = url;
      if (isPrivateHost(hostname)) return false;

      // Direct video file URLs
      const { pathname } = url;
      const ext = pathname.split('.').pop()?.toLowerCase();
      if (ext && ALLOWED_VIDEO_EXTENSIONS.includes(ext)) {
        return true;
      }

      // Known embed platform (check hostname)
      if (ALLOWED_VIDEO_EMBEDS.includes(hostname)) {
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  /** Validate sections and return them with sanitized text content
   * @param requireContent - if true, throws ValidationError if text in any section content is empty
   */
  private static validateAndPrepareSections(
    sections: Post['sections'],
    userId: string,
    { requireContent = true }: { requireContent?: boolean } = {},
  ) {
    if (sections.length > POST_SECTIONS_MAX) {
      throw new ValidationError(ERRORS.POST_SECTIONS_MAX_EXCEEDED);
    }

    let textContentSumLength = 0;

    // eslint-disable-next-line no-restricted-syntax
    for (const section of sections) {
      if (!allowedSectionTypes.includes(section.type)) {
        throw new ValidationError(ERRORS.POST_UNSUPPORTED_SECTION_TYPE);
      }

      if (section.type === POST_SECTION_TYPES.TEXT) {
        if (requireContent && (!section.content || !section.content.length)) {
          throw new ValidationError(ERRORS.POST_TEXT_SECTION_CONTENT_REQUIRED);
        }

        if (section.content) {
          textContentSumLength += section.content.length;

          if (textContentSumLength > POST_SECTIONS_MAX_LENGTH) {
            throw new ValidationError(ERRORS.POST_SECTIONS_MAX_LENGTH_EXCEEDED);
          }

          section.content = sanitizeHtml(
            section.content,
            SanitizeHtmlProfile.Post,
          );

          const hasContent = hasSanitizedHtmlContent(section.content, {
            allowHorizontalRule: true,
          });

          if (!hasContent) {
            if (requireContent) {
              throw new ValidationError(
                ERRORS.POST_TEXT_SECTION_CONTENT_REQUIRED,
              );
            }

            section.content = '';
          }
        }
      }

      if (section.type === POST_SECTION_TYPES.PICTURE) {
        if (!section.url) {
          throw new ValidationError(ERRORS.POST_PIC_SECTION_URL_REQUIRED);
        }

        // Handle external image URLs
        if (!section.isFile && !isValidExternalImageUrl(section.url)) {
          throw new ValidationError(ERRORS.POST_PIC_SECTION_URL_INVALID);
        }

        if (
          section.isFile &&
          !PostValidator.isValidUploadedFileUrl(section.url, userId)
        ) {
          throw new ValidationError(ERRORS.POST_PIC_SECTION_URL_INVALID);
        }
      }

      if (section.type === POST_SECTION_TYPES.VIDEO) {
        if (!section.url || !this.isValidVideoUrl(section.url)) {
          throw new ValidationError(ERRORS.POST_VIDEO_SECTION_URL_REQUIRED);
        }
      }

      if (section.hash?.length !== 4) {
        section.hash = nanoid(4);
      }
    }

    return sections;
  }

  /** Validate a post and return it with sanitized sections
   * throw ValidationError if validation fails
   */
  static validateAndPrepare(post: PostValidationInput, userId: string) {
    const { title, sections, tags } = post;

    if (!title) {
      throw new ValidationError(ERRORS.POST_TITLE_REQUIRED);
    }

    if (!sections || sections.length < 1) {
      throw new ValidationError(ERRORS.POST_SECTIONS_REQUIRED);
    }

    PostValidator.validateTitle(title);

    const preparedTags =
      tags !== undefined
        ? PostValidator.validateAndPrepareTags(tags)
        : undefined;

    PostValidator.validateAndPrepareSections(sections, userId);

    return {
      title,
      sections,
      tags: preparedTags,
    };
  }

  /** Validate template fields when present, without requiring them.
   * Returns validated fields with sanitized sections.
   */
  static validateTemplate(template: PostValidationInput, userId: string) {
    const { title, sections, tags } = template;

    if (title !== undefined) {
      PostValidator.validateTitle(title);
    }

    const preparedTags =
      tags !== undefined
        ? PostValidator.validateAndPrepareTags(tags)
        : undefined;

    if (sections) {
      PostValidator.validateAndPrepareSections(sections, userId, {
        requireContent: false,
      });
    }

    return {
      title,
      sections,
      tags: preparedTags,
    };
  }
}
