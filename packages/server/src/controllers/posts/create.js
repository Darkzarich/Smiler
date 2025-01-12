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
import { ValidationError, ERRORS } from '../../errors/index.js';
import { sendSuccess } from '../../utils/responseUtils.js';

const allowedSectionTypes = Object.values(POST_SECTION_TYPES);

export async function create(req, res) {
  // TODO: rework this | move validation

  // TODO: frontend sends hash should think about avoiding that anyhow

  const { userId } = req.session;
  const { title } = req.body;
  const { tags } = req.body;
  const { sections } = req.body;

  if (!title) {
    throw new ValidationError(ERRORS.POST_TITLE_REQUIRED);
  }

  if (!sections || sections.length < 1) {
    throw new ValidationError(ERRORS.POST_SECTIONS_REQUIRED);
  }

  if (sections.length > POST_SECTIONS_MAX) {
    throw new ValidationError(ERRORS.POST_SECTIONS_MAX_EXCEEDED);
  }

  if (title.length > POST_TITLE_MAX_LENGTH) {
    throw new ValidationError(ERRORS.POST_TITLE_MAX_LENGTH_EXCEEDED);
  }

  if (tags) {
    if (tags.length > POST_MAX_TAGS) {
      throw new ValidationError(ERRORS.POST_MAX_TAGS_EXCEEDED);
    }

    if (tags.some((tag) => tag.length > POST_MAX_TAG_LEN)) {
      throw new ValidationError(ERRORS.POST_TAG_MAX_LEN_EXCEEDED);
    }
  }

  let textContentSumLength = 0;

  // eslint-disable-next-line no-restricted-syntax
  for (const section of sections) {
    if (!allowedSectionTypes.includes(section.type)) {
      throw new ValidationError(ERRORS.POST_UNSUPPORTED_SECTION_TYPE);
    }

    // Sum length of text sections and check if it exceeds max total length
    if (section.type === POST_SECTION_TYPES.TEXT) {
      if (!section.content || !section.content.length) {
        throw new ValidationError(ERRORS.POST_TEXT_SECTION_CONTENT_REQUIRED);
      }

      textContentSumLength += section.content.length;

      if (textContentSumLength > POST_SECTIONS_MAX_LENGTH) {
        throw new ValidationError(ERRORS.POST_SECTIONS_MAX_LENGTH_EXCEEDED);
      }

      section.content = sanitizeHtml(section.content);
    }

    if (section.type === POST_SECTION_TYPES.PICTURE) {
      if (!section.url || !section.url.match(/^https?:\/\//)) {
        throw new ValidationError(ERRORS.POST_PIC_SECTION_URL_REQUIRED);
      }
    }

    if (section.type === POST_SECTION_TYPES.VIDEO) {
      if (!section.url || !section.url.match(/^https?:\/\//)) {
        throw new ValidationError(ERRORS.POST_VIDEO_SECTION_URL_REQUIRED);
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

  const populatedPost = await post
    .populate('author', 'login avatar')
    .execPopulate();

  sendSuccess(res, populatedPost.toResponse());
}
