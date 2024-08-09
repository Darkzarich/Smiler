const { differenceInMilliseconds, millisecondsToMinutes } = require('date-fns');
const sanitizeHtml = require('../../libs/sanitize-html');

const Post = require('../../models/Post');
const {
  POST_TIME_TO_UPDATE,
  POST_MAX_TAGS,
  POST_MAX_TAG_LEN,
  POST_SECTION_TYPES,
} = require('../../constants');
const {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} = require('../../errors');
const { removeFileByPath } = require('../../utils/remove-file-by-path');
const { sendSuccess } = require('../../utils/responseUtils');

exports.updateById = async (req, res) => {
  // TODO: validate sections on update by type and other stuff the same as when creating post
  // TODO: move all Post validation in one place

  const { userId } = req.session;
  const { id: postId } = req.params;
  const { title, tags, sections: newSections } = req.body;

  const targetPost = await Post.findById(postId);

  if (!targetPost) {
    throw new NotFoundError('Post is not found');
  }

  if (targetPost.author.toString() !== userId) {
    throw new ForbiddenError('You can edit only your own posts');
  }

  if (
    differenceInMilliseconds(Date.now(), targetPost.createdAt) >
    POST_TIME_TO_UPDATE
  ) {
    throw new ForbiddenError(
      `You can edit post only within the first ${millisecondsToMinutes(POST_TIME_TO_UPDATE)} min`,
    );
  }

  targetPost.title = title || targetPost.title;

  if (tags) {
    if (tags.length > POST_MAX_TAGS) {
      throw new ValidationError(
        `Too many tags, max amount is ${POST_MAX_TAGS}`,
      );
    }

    if (tags.some((tag) => tag.length > POST_MAX_TAG_LEN)) {
      throw new ValidationError(
        `Exceeded max length of a tag ${POST_MAX_TAGS}`,
      );
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
};
