import User from '../../models/User.js';
import { NotFoundError, ERRORS } from '../../errors/index.js';
import { sendSuccess } from '../../utils/response-utils.js';

export async function getSettings(req, res) {
  const { userId } = req.session;

  const user = await User.findById(userId)
    .populate('usersFollowed', 'login avatar')
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
