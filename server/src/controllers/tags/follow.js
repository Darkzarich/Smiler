const User = require('../../models/User');

const { TAGS_MAX_LENGTH } = require('../../constants');
const { generateError, success } = require('../../utils/utils');

exports.follow = async (req, res, next) => {
  const { tag } = req.params;
  const { userId } = req.session;

  if (tag.length > TAGS_MAX_LENGTH) {
    generateError(`The tag can't be longer than${TAGS_MAX_LENGTH}`, 422, next);
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
};
