const User = require('../../models/User');
const { ValidationError } = require('../../errors');
const { TAGS_MAX_LENGTH } = require('../../constants');
const { sendSuccess } = require('../../utils/responseUtils');

exports.unfollow = async (req, res) => {
  const { tag } = req.params;
  const { userId } = req.session;

  if (tag.length > TAGS_MAX_LENGTH) {
    throw new ValidationError(
      `The tag can't be longer than ${TAGS_MAX_LENGTH}`,
    );
  }

  await User.findByIdAndUpdate(userId, {
    $pull: {
      tagsFollowed: tag,
    },
  });

  sendSuccess(res);
};
