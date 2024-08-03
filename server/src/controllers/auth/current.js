const User = require('../../models/User');
const { success } = require('../../utils/utils');

exports.current = async (req, res) => {
  const { userId } = req.session;

  if (!userId) {
    success(req, res, {
      isAuth: false,
    });
  }

  const user = await User.findById(userId).lean();

  return success(req, res, {
    login: user.login,
    isAuth: true,
    rating: user.rating || 0,
    avatar: user.avatar || '',
    email: user.email || '',
    tagsFollowed: user.tagsFollowed || [],
    followersAmount: user.followersAmount,
  });
};
