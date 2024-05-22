const Comment = require('../../models/Comment');
const consts = require('../../const/const');
const { success, asyncErrorHandler, generateError } = require('../../utils/utils');

exports.updateById = asyncErrorHandler(async (req, res, next) => {
  const { userId } = req.session;
  const { id } = req.params;
  const { body } = req.body;

  const comFound = await Comment.findById(id);

  if (comFound) {
    if (comFound.author.id.toString() !== userId) {
      generateError('You can edit only your own comments', 403, next);
    } else if (comFound.children.length > 0) {
      generateError('You can\'t edit a comment if someone already answered it', 405, next);
    } else {
      const comFoundDate = new Date(comFound.createdAt.toString()).getTime();
      const dateNow = new Date().getTime();

      if (dateNow - comFoundDate > consts.COMMENT_TIME_TO_UPDATE) {
        generateError(`You can update comment only within first ${consts.COMMENT_TIME_TO_UPDATE / 1000 / 60} min`, 405, next);
      } else {
        comFound.body = body;
        await comFound.save();

        success(req, res);
      }
    }
  } else {
    generateError('Comment is not found', 404, next);
  }
});
