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
} from '@constants/index';
import { ValidationError, ERRORS } from '@errors';
import sanitizeHtml from '@libs/sanitize-html';
import { nanoid } from 'nanoid';
import { isValidExternalImageUrl } from '@utils/is-valid-external-image-url';

const allowedSectionTypes = Object.values(POST_SECTION_TYPES);

export class PostValidator {
  static LOCAL_HOST_NAMES = ['localhost', '127.0.0.1', '::1'];
  static PROTOCOLS = ['http:', 'https:'];
  static PRIVATE_IP_REGEXP = /^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])\.|^192\.168\./;
  static ALLOWED_PICTURE_EXTENSIONS_FOR_REGEXP =
    ALLOWED_PICTURE_EXTENSIONS.join('|');

  /** Validate title length */
  private static validateTitle(title: string) {
    if (title.length > POST_TITLE_MAX_LENGTH) {
      throw new ValidationError(ERRORS.POST_TITLE_MAX_LENGTH_EXCEEDED);
    }
  }

  /** Validate tags count and length */
  private static validateTags(tags: string[]) {
    if (tags.length > POST_MAX_TAGS) {
      throw new ValidationError(ERRORS.POST_MAX_TAGS_EXCEEDED);
    }

    if (tags.some((tag) => tag.length > POST_MAX_TAG_LEN)) {
      throw new ValidationError(ERRORS.POST_TAG_MAX_LEN_EXCEEDED);
    }
  }

  private static isValidVideoUrl(urlString: string): boolean {
    try {
      const url = new URL(urlString);
      if (!PostValidator.PROTOCOLS.includes(url.protocol)) return false;

      // Block localhost, private IPs (SSRF protection)
      const { hostname } = url;
      if (PostValidator.LOCAL_HOST_NAMES.includes(hostname)) return false;
      if (PostValidator.PRIVATE_IP_REGEXP.test(hostname)) return false;

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

          section.content = sanitizeHtml(section.content);

          if (!section.content) {
            throw new ValidationError(
              ERRORS.POST_TEXT_SECTION_CONTENT_REQUIRED,
            );
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

        // eslint-disable-next-line security/detect-non-literal-regexp
        const internalUrlRegex = new RegExp(
          `^\\/uploads\\/[\\w/-]{1,100}\\/[\\w.-]+\\.(${PostValidator.ALLOWED_PICTURE_EXTENSIONS_FOR_REGEXP})$`,
          'i',
        );

        if (
          section.isFile &&
          (!section.url.match(internalUrlRegex) || section.url.includes('..'))
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
  static validateAndPrepare(
    post: Partial<Pick<Post, 'title' | 'sections' | 'tags'>>,
  ) {
    const { title, sections, tags } = post;

    if (!title) {
      throw new ValidationError(ERRORS.POST_TITLE_REQUIRED);
    }

    if (!sections || sections.length < 1) {
      throw new ValidationError(ERRORS.POST_SECTIONS_REQUIRED);
    }

    PostValidator.validateTitle(title);

    if (tags) {
      PostValidator.validateTags(tags);
    }

    PostValidator.validateAndPrepareSections(sections);

    return {
      title,
      sections,
      tags,
    };
  }

  /** Validate template fields when present, without requiring them.
   * Returns validated fields with sanitized sections.
   */
  static validateTemplate(
    template: Partial<Pick<Post, 'title' | 'sections' | 'tags'>>,
  ) {
    const { title, sections, tags } = template;

    if (title !== undefined) {
      PostValidator.validateTitle(title);
    }

    if (tags) {
      PostValidator.validateTags(tags);
    }

    if (sections) {
      PostValidator.validateAndPrepareSections(sections, {
        requireContent: false,
      });
    }

    return {
      title,
      sections,
      tags,
    };
  }
}
