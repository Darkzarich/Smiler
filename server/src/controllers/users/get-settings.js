import User from '../../models/User.js';
import { NotFoundError, ERRORS } from '../../errors/index.js';
import { sendSuccess } from '../../utils/responseUtils.js';

export async function getSettings(req, res) {
  const { userId } = req.session;

  const user = await User.findById(userId)
    .populate('usersFollowed', 'login avatar id')
    .lean();

  if (!user) {
    throw new NotFoundError(ERRORS.USER_NOT_FOUND);
  }

  const following = {
    authors: user.usersFollowed,
    tags: user.tagsFollowed,
    bio: user.bio,
    avatar: user.avatar,
  };

  sendSuccess(res, following);
}
