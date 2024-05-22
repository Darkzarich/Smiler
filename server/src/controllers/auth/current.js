const User = require('../../models/User');
const { success, asyncErrorHandler } = require('../../utils/utils');

exports.current = asyncErrorHandler(async (req, res) => {
  const { userId } = req.session;
  let authState = {};

  if (userId) {
    const user = await User.findById(userId).lean();

    authState = {
      login: user.login,
      isAuth: true,
      rating: user.rating || 0,
      avatar: user.avatar || '',
      email: user.email || '',
      tagsFollowed: user.tagsFollowed || [],
      followersAmount: user.followersAmount,
    };
  } else {
    authState.isAuth = false;
  }

  success(req, res, authState);
});
