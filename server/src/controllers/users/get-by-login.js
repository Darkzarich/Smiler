import User from '../../models/User.js';
import { NotFoundError, ERRORS } from '../../errors/index.js';
import { sendSuccess } from '../../utils/responseUtils.js';

export async function getByLogin(req, res) {
  const { login } = req.params;
  const { userId: currentUserId } = req.session;

  const requestedUser = await User.findOne({
    login,
  }).select({
    login: 1,
    rating: 1,
    bio: 1,
    avatar: 1,
    createdAt: 1,
    followersAmount: 1,
  });

  if (!requestedUser) {
    throw new NotFoundError(ERRORS.USER_NOT_FOUND);
  }

  // The current user requested their own profile
  if (currentUserId === requestedUser._id) {
    sendSuccess(res, requestedUser.toJSON());

    return;
  }

  const currentUser = await User.findById(currentUserId).select('');

  const response = {
    ...requestedUser.toJSON(),
    isFollowed: currentUser ? currentUser.isFollowed(requestedUser._id) : false,
  };

  sendSuccess(res, response);
}
