const User = require('../models/User');

const { generateError, success, asyncErrorHandler } = require('./utils/utils');

const consts = require('../const/const');

module.exports = {
  follow: asyncErrorHandler(async (req, res, next) => {
    const { tag } = req.params;
    const { userId } = req.session;

    if (tag.length > consts.TAGS_MAX_LENGTH) {
      generateError(`The tag can't be longer than${consts.TAGS_MAX_LENGTH}`, 422, next);
    } else {
      try {
        await User.findByIdAndUpdate(userId, {
          $addToSet: {
            tagsFollowed: tag,
          },
        });
        success(req, res);
      } catch (e) {
        generateError(e, 500, next);
      }
    }
  }),
  unfollow: asyncErrorHandler(async (req, res, next) => {
    const { tag } = req.params;
    const { userId } = req.session;

    if (tag.length > consts.TAGS_MAX_LENGTH) {
      generateError(`The tag can't be longer than${consts.TAGS_MAX_LENGTH}`, 422, next);
    } else {
      try {
        await User.findByIdAndUpdate(userId, {
          $pull: {
            tagsFollowed: tag,
          },
        });
        success(req, res);
      } catch (e) {
        generateError(e, 500, next);
      }
    }
  }),
};
