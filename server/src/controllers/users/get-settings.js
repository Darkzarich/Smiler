const User = require('../../models/User');

const { NotFoundError } = require('../../errors');
const { sendSuccess } = require('../../utils/responseUtils');

exports.getSettings = async (req, res) => {
  const { userId } = req.session;

  const user = await User.findById(userId).populate(
    'usersFollowed',
    'login avatar id',
  );

  if (!user) {
    throw new NotFoundError('User is not found');
  }

  const following = {
    authors: user.usersFollowed,
    tags: user.tagsFollowed,
    bio: user.bio,
    avatar: user.avatar,
  };

  sendSuccess(res, following);
};
