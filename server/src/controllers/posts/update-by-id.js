const fs = require('fs');
const path = require('path');

const Post = require('../../models/Post');
const consts = require('../../const/const');
const { success, asyncErrorHandler, generateError } = require('../../utils/utils');

exports.updateById = asyncErrorHandler(async (req, res, next) => {
  // TODO: validate sections on update by type and other stuff the same as when creating post

  const { userId } = req.session;
  const { id } = req.params;
  const { title } = req.body;
  const { tags } = req.body;
  const { sections } = req.body;

  const foundPost = await Post.findById(id);

  if (foundPost) {
    if (foundPost.author.toString() !== userId) { generateError('The post is not yours', 403, next); return; }

    const curDate = new Date().getTime();
    const postDate = new Date(foundPost.createdAt.toString()).getTime();

    if (curDate - postDate > consts.POST_TIME_TO_UPDATE) {
      generateError(`You can edit post only within first ${consts.POST_TIME_TO_UPDATE / 1000 / 60} min`, 405, next);
    } else {
      const toDelete = [];

      if (tags) {
        if (tags.length > consts.POST_MAX_TAGS) { generateError('Too many tags', 422, next); return; }
        if (tags.find(el => el.length > consts.POST_MAX_TAG_LEN)) { generateError('Exceeded max length of a tag', 422, next); return; }
      }

      if (sections) {
        foundPost.sections = sections;

        // Searching for pics that got removed from post
        foundPost.sections.forEach((rowSec) => {
          if (rowSec.type === consts.POST_SECTION_TYPES.PICTURE && rowSec.isFile) {
            const item = sections.find(el => (el.url === rowSec.url));
            if (!item) {
              toDelete.push(rowSec.url);
            }
          }
        });
      }

      foundPost.title = title || foundPost.title;
      foundPost.tags = tags || foundPost.tags;

      if (toDelete && toDelete instanceof Array && toDelete.length > 0) {
        toDelete.forEach((el) => {
          const absolutePath = path.join(process.cwd(), el);

          fs.exists(absolutePath, (exist) => {
            if (exist) {
              fs.unlink(absolutePath, (err) => {
                if (err) {
                  generateError(err, 500, next);
                }
              });
            }
          });
        });
      }
      await foundPost.save();
      success(req, res);
    }
  } else {
    generateError('Post doesn\'t exist', 404, next);
  }
});
