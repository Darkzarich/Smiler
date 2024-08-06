const User = require('../../models/User');
const { sendSuccess } = require('../../utils/responseUtils');
const { NotFoundError } = require('../../errors');

exports.current = async (req, res) => {
  const { userId } = req.session;

  if (!userId) {
    return sendSuccess(res, {
      isAuth: false,
    });
  }

  const user = await User.findById(userId).lean();

  if (!user) {
    throw new NotFoundError();
  }

  return sendSuccess(res, {
    login: user.login,
    isAuth: true,
    rating: user.rating || 0,
    avatar: user.avatar || '',
    email: user.email || '',
    tagsFollowed: user.tagsFollowed || [],
    followersAmount: user.followersAmount,
  });
};
