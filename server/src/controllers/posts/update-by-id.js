const { differenceInMilliseconds } = require('date-fns');
const fs = require('fs');
const path = require('path');
const sanitizeHtml = require('../../libs/sanitize-html');

const Post = require('../../models/Post');
const {
  POST_TIME_TO_UPDATE,
  POST_MAX_TAGS,
  POST_MAX_TAG_LEN,
  POST_SECTION_TYPES,
} = require('../../const/const');
const { success, generateError } = require('../../utils/utils');

exports.updateById = async (req, res, next) => {
  // TODO: validate sections on update by type and other stuff the same as when creating post
  // TODO: move all Post validation in one place

  const { userId } = req.session;
  const { id } = req.params;
  const { title } = req.body;
  const { tags } = req.body;
  const { sections: newSections } = req.body;

  const post = await Post.findById(id);

  if (!post) {
    return generateError('Post is not found', 404, next);
  }

  if (post.author.toString() !== userId) {
    return generateError('You can edit only your own posts', 403, next);
  }

  if (
    differenceInMilliseconds(Date.now(), post.createdAt) > POST_TIME_TO_UPDATE
  ) {
    return generateError(
      `You can edit post only within first ${POST_TIME_TO_UPDATE} min`,
      405,
      next,
    );
  }

  if (tags) {
    if (tags.length > POST_MAX_TAGS) {
      return generateError(
        `Too many tags, max amount is ${POST_MAX_TAGS}`,
        422,
        next,
      );
    }

    if (tags.find((el) => el.length > POST_MAX_TAG_LEN)) {
      return generateError('Exceeded max length of a tag', 422, next);
    }

    post.tags = tags;
  }

  const filesToDelete = [];

  if (newSections) {
    newSections.forEach((section) => {
      if (section.type === POST_SECTION_TYPES.TEXT) {
        // eslint-disable-next-line no-param-reassign
        section.content = sanitizeHtml(section.content);
      }
    });

    // Looking for pics that got removed from post
    post.sections.forEach((section) => {
      if (section.type !== POST_SECTION_TYPES.PICTURE || !section.isFile) {
        return;
      }

      const item = newSections.find(
        (newSection) => newSection.url === section.url,
      );

      if (!item) {
        filesToDelete.push(section.url);
      }
    });

    post.sections = newSections;
  }

  if (title) {
    post.title = title;
  }

  if (filesToDelete.length > 0) {
    filesToDelete.forEach((el) => {
      const absolutePath = path.join(process.cwd(), el);

      fs.access(absolutePath, (accessErr) => {
        if (!accessErr) {
          // eslint-disable-next-line security/detect-non-literal-fs-filename
          fs.unlink(absolutePath, (err) => {
            if (err) {
              generateError(err, 500, next);
            }
          });
        }
      });
    });
  }

  await post.save();

  success(req, res);
};
