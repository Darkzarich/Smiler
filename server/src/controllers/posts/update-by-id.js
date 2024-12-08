import { differenceInMilliseconds } from 'date-fns';
import sanitizeHtml from '../../libs/sanitize-html.js';
import Post from '../../models/Post.js';
import {
  POST_SECTION_TYPES,
  POST_MAX_TAGS,
  POST_MAX_TAG_LEN,
  POST_TIME_TO_UPDATE,
} from '../../constants/index.js';
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
  ERRORS,
} from '../../errors/index.js';
import { removeFileByPath } from '../../utils/remove-file-by-path.js';
import { sendSuccess } from '../../utils/responseUtils.js';

export async function updateById(req, res) {
  // TODO: validate sections on update by type and other stuff the same as when creating post
  // TODO: move all Post validation in one place

  const { userId } = req.session;
  const { id: postId } = req.params;
  const { title, tags, sections: newSections } = req.body;

  const targetPost = await Post.findById(postId);

  if (!targetPost) {
    throw new NotFoundError(ERRORS.POST_NOT_FOUND);
  }

  if (targetPost.author.toString() !== userId) {
    throw new ForbiddenError(ERRORS.POST_CANT_EDIT_NOT_OWN);
  }

  if (
    differenceInMilliseconds(Date.now(), targetPost.createdAt) >
    POST_TIME_TO_UPDATE
  ) {
    throw new ForbiddenError(ERRORS.POST_CAN_EDIT_WITHIN_TIME);
  }

  targetPost.title = title || targetPost.title;

  if (tags) {
    if (tags.length > POST_MAX_TAGS) {
      throw new ValidationError(ERRORS.POST_MAX_TAGS_EXCEEDED);
    }

    if (tags.some((tag) => tag.length > POST_MAX_TAG_LEN)) {
      throw new ValidationError(ERRORS.POST_TAG_MAX_LEN_EXCEEDED);
    }
  }

  const filePathsToDelete = [];

  if (newSections) {
    newSections.forEach((section) => {
      if (section.type === POST_SECTION_TYPES.TEXT) {
        // eslint-disable-next-line no-param-reassign
        section.content = sanitizeHtml(section.content);
      }
    });

    // Looking for sections with a type of "picture" that were uploaded as a file
    // and that got removed from the post in the update
    targetPost.sections.forEach((section) => {
      if (section.type !== POST_SECTION_TYPES.PICTURE || !section.isFile) {
        return;
      }

      const item = newSections.find(
        (newSection) => newSection.url === section.url,
      );

      if (!item) {
        filePathsToDelete.push(section.url);
      }
    });
  }

  targetPost.title = title || targetPost.title;
  targetPost.tags = tags || targetPost.tags;
  targetPost.sections = newSections || targetPost.sections;

  await targetPost.save();

  sendSuccess(res, targetPost);

  // Remove all deleted files

  // eslint-disable-next-line no-restricted-syntax
  for (const filePath of filePathsToDelete) {
    removeFileByPath(filePath);
  }
}
