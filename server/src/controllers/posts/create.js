import slugLib from 'slug';
import crypto from 'crypto';
import sanitizeHtml from '../../libs/sanitize-html.js';
import User from '../../models/User.js';
import Post from '../../models/Post.js';
import {
  POST_SECTION_TYPES,
  POST_SECTIONS_MAX,
  POST_SECTIONS_MAX_LENGTH,
  POST_TITLE_MAX_LENGTH,
  POST_MAX_TAGS,
  POST_MAX_TAG_LEN,
} from '../../constants/index.js';
import { ValidationError } from '../../errors/index.js';
import { sendSuccess } from '../../utils/responseUtils.js';

const allowedSectionTypes = Object.values(POST_SECTION_TYPES);

export async function create(req, res) {
  // TODO: rework this | move validation

  const { userId } = req.session;
  const { title } = req.body;
  const { tags } = req.body;
  const { sections } = req.body;

  if (!title) {
    throw new ValidationError('Title is required');
  }

  if (!sections || sections.length < 1) {
    throw new ValidationError('At least one section is required');
  }

  if (sections.length > POST_SECTIONS_MAX) {
    throw new ValidationError('Exceeded max amount of sections');
  }

  if (title.length > POST_TITLE_MAX_LENGTH) {
    throw new ValidationError('Exceeded max length of title');
  }

  if (tags) {
    if (tags.length > POST_MAX_TAGS) {
      throw new ValidationError('Too many tags');
    }

    if (tags.some((tag) => tag.length > POST_MAX_TAG_LEN)) {
      throw new ValidationError('Exceeded max length of a tag');
    }
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const section of sections) {
    if (!allowedSectionTypes.includes(section.type)) {
      throw new ValidationError(`Unsupported section type: ${section.type}`);
    }

    let textContentSumLength = 0;

    // Sum length of text sections and check if it exceeds max total length
    if (section.type === POST_SECTION_TYPES.TEXT) {
      if (!section.content || !section.content.length) {
        throw new ValidationError('Text section content is required');
      }

      textContentSumLength += section.content.length;

      if (textContentSumLength > POST_SECTIONS_MAX_LENGTH) {
        throw new ValidationError(
          `Text sections sum length exceeded max allowed length of ${POST_SECTIONS_MAX_LENGTH} symbols`,
        );
      }

      section.content = sanitizeHtml(section.content);
    }

    if (section.type === POST_SECTION_TYPES.PICTURE) {
      if (!section.url) {
        throw new ValidationError('Image section url is required');
      }
    }

    if (section.type === POST_SECTION_TYPES.VIDEO) {
      if (!section.url) {
        throw new ValidationError('Video section url is required');
      }
    }
  }

  const [post] = await Promise.all([
    Post.create({
      title,
      sections,
      tags,
      slug: `${slugLib(title)}-${crypto.randomUUID()}`,
      author: userId,
    }),
    // Clear user template
    User.updateOne(
      { _id: userId },
      {
        $set: {
          'template.title': '',
          'template.sections': [],
          'template.tags': [],
        },
      },
    ),
  ]);

  sendSuccess(res, post);
}
