const fs = require('fs');
const path = require('path');

const Post = require('../../models/Post');

const consts = require('../../const/const');
const { success, generateError } = require('../../utils/utils');

exports.deleteById = async (req, res, next) => {
  const { userId } = req.session;
  const { id } = req.params;

  const foundPost = await Post.findById(id);

  if (foundPost) {
    if (foundPost.author.toString() !== userId) {
      generateError('The post is not yours', 403, next);
      return;
    }

    const curDate = new Date().getTime();
    const postDate = new Date(foundPost.createdAt.toString()).getTime();

    if (curDate - postDate > consts.POST_TIME_TO_UPDATE) {
      generateError(
        `You can delete post only within first ${consts.POST_TIME_TO_UPDATE / 1000 / 60} min`,
        405,
        next,
      );
    } else {
      const { sections } = foundPost;

      /**
       * TODO: need to somehow check if post has comments or no and then don't allow to delete or
       * delete related comments
       */

      await foundPost.remove();

      const filePicSections = sections.filter(
        (sec) => sec.type === consts.POST_SECTION_TYPES.PICTURE && sec.isFile,
      );

      filePicSections.forEach((sec) => {
        const absolutePath = path.join(process.cwd(), sec.url);

        fs.access(absolutePath, (err) => {
          if (err) {
            generateError(err, 500, next);

            return;
          }

          // eslint-disable-next-line security/detect-non-literal-fs-filename
          fs.unlink(absolutePath, (unlinkErr) => {
            if (unlinkErr) {
              generateError(err, 500, next);
            }
          });
        });
      });

      success(req, res);
    }
  } else {
    generateError("Post doesn't exist", 404, next);
  }
};
