import { omit } from 'lodash-es';
import User from '../../models/User';
import { NotFoundError, ERRORS } from '../../errors/index';
import { sendSuccess } from '../../utils/response-utils';

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

  if (currentUserId === requestedUser._id.toString()) {
    sendSuccess(res, omit(requestedUser.toJSON(), '_id'));

    return;
  }

  const currentUser = await User.findById(currentUserId).select({
    usersFollowed: 1,
  });

  const response = {
    ...omit(requestedUser.toJSON(), '_id'),
    isFollowed: currentUser ? currentUser.isFollowed(requestedUser._id) : false,
  };

  sendSuccess(res, response);
}
