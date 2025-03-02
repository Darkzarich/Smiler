import { differenceInMilliseconds } from 'date-fns';
import Post from '../../models/Post.js';
import {
  POST_SECTION_TYPES,
  POST_TIME_TO_UPDATE,
} from '../../constants/index.js';
import { NotFoundError, ForbiddenError, ERRORS } from '../../errors/index.js';
import { removeFileByPath } from '../../utils/remove-file-by-path.js';
import { sendSuccess } from '../../utils/response-utils.js';
import { PostValidator } from '../../validators/PostValidator.js';

export async function updateById(req, res) {
  // TODO: validate sections on update by type and other stuff the same as when creating post
  // TODO: move all Post validation in one place

  const { userId } = req.session;
  const { id: postId } = req.params;

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

  const {
    title,
    sections: newSections,
    tags,
  } = PostValidator.validateAndPrepare({
    title: req.body.title || targetPost.title,
    sections: req.body.sections || targetPost.sections,
    tags: req.body.tags || targetPost.tags,
  });

  const filePathsToDelete = [];

  if (newSections) {
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

  targetPost.title = title;
  targetPost.tags = tags;
  targetPost.sections = newSections;

  await targetPost.save();

  sendSuccess(res, targetPost.toResponse());

  // Remove all deleted files

  // eslint-disable-next-line no-restricted-syntax
  for (const filePath of filePathsToDelete) {
    removeFileByPath(filePath);
  }
}
