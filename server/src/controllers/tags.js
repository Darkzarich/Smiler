const User = require('../models/User');

const { generateError, success } = require('./utils/utils');

const consts = require('../const/const');

module.exports = {
  follow: async (req, res, next) => {
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
        success(res);
      } catch (e) {
        generateError(e, 500, next);
      }
    }
  },
  unfollow: async (req, res, next) => {
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
        success(res);
      } catch (e) {
        generateError(e, 500, next);
      }
    }
  },
};
