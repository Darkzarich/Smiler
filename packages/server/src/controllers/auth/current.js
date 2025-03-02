import User from '../../models/User.js';
import { sendSuccess } from '../../utils/response-utils.js';
import { NotFoundError } from '../../errors/index.js';

export async function current(req, res) {
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
    id: user._id,
    login: user.login,
    isAuth: true,
    rating: user.rating || 0,
    avatar: user.avatar || '',
    email: user.email || '',
    tagsFollowed: user.tagsFollowed || [],
    followersAmount: user.followersAmount,
  });
}
