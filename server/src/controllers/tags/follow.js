const User = require('../../models/User');
const { ValidationError } = require('../../errors');
const { TAGS_MAX_LENGTH } = require('../../constants');
const { sendSuccess } = require('../../utils/responseUtils');

exports.follow = async (req, res) => {
  const { tag } = req.params;
  const { userId } = req.session;

  if (tag.length > TAGS_MAX_LENGTH) {
    throw new ValidationError(
      `The tag can't be longer than ${TAGS_MAX_LENGTH}`,
    );
  }

  await User.findByIdAndUpdate(userId, {
    $addToSet: {
      tagsFollowed: tag,
    },
  });

  sendSuccess(res);
};
