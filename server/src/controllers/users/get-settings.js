const User = require('../../models/User');

const {
  generateError,
  success,
  asyncErrorHandler,
} = require('../../utils/utils');

exports.getSettings = asyncErrorHandler(async (req, res, next) => {
  const { userId } = req.session;

  const user = await User.findById(userId).populate(
    'usersFollowed',
    'login avatar id',
  );

  if (user) {
    const following = {
      authors: user.usersFollowed,
      tags: user.tagsFollowed,
      bio: user.bio,
      avatar: user.avatar,
    };

    success(req, res, following);
  } else {
    generateError('User is not found', 404, next);
  }
});
