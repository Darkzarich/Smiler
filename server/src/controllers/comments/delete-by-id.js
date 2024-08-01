const { differenceInMilliseconds } = require('date-fns');
const Comment = require('../../models/Comment');
const { COMMENT_TIME_TO_UPDATE } = require('../../const/const');
const { success, generateError } = require('../../utils/utils');

exports.deleteById = async (req, res, next) => {
  const { userId } = req.session;
  const { id } = req.params;

  const comFound = await Comment.findById(id);

  if (comFound) {
    if (comFound.author.id.toString() !== userId) {
      generateError('You can delete only your own comments', 403, next);
    } else if (
      differenceInMilliseconds(Date.now(), comFound.createdAt) >
      COMMENT_TIME_TO_UPDATE
    ) {
      generateError(
        `You can delete comment only within the first ${COMMENT_TIME_TO_UPDATE} min`,
        405,
        next,
      );
    } else if (comFound.children.length > 0) {
      comFound.deleted = true;
      await comFound.save();
      success(req, res);
    } else {
      await comFound.remove();
      success(req, res);
    }
  } else {
    generateError('Comment is not found', 404, next);
  }
};
