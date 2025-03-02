import User from '../../models/User.js';
import { ForbiddenError, NotFoundError, ERRORS } from '../../errors/index.js';
import { sendSuccess } from '../../utils/response-utils.js';

export async function followById(req, res) {
  const { id } = req.params;
  const { userId } = req.session;

  if (id === userId) {
    throw new ForbiddenError(ERRORS.USER_CANT_FOLLOW_OWN);
  }

  const [userFollowing, userFollowed] = await Promise.all([
    User.findById(userId),
    User.findById(id),
  ]);

  if (!userFollowed) {
    throw new NotFoundError(ERRORS.USER_NOT_FOUND);
  }

  if (userFollowing.usersFollowed.includes(id)) {
    throw new ForbiddenError(ERRORS.USER_CANT_FOLLOW_ALREADY_FOLLOWED);
  }

  await Promise.all([
    userFollowing.updateOne({ $push: { usersFollowed: id } }),
    userFollowed.updateOne({ $inc: { followersAmount: 1 } }),
  ]);

  sendSuccess(res);
}
