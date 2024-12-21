import User from '../../models/User.js';
import { ForbiddenError, NotFoundError, ERRORS } from '../../errors/index.js';
import { sendSuccess } from '../../utils/responseUtils.js';

export async function unfollowById(req, res) {
  const { id } = req.params;
  const { userId } = req.session;

  if (id === userId) {
    throw new ForbiddenError(ERRORS.USER_CANT_UNFOLLOW_OWN);
  }

  const [userUnfollowing, userUnfollowed] = await Promise.all([
    User.findById(userId),
    User.findById(id),
  ]);

  if (!userUnfollowed) {
    throw new NotFoundError(ERRORS.USER_NOT_FOUND);
  }

  if (!userUnfollowing.usersFollowed.includes(id)) {
    throw new ForbiddenError(ERRORS.USER_CANT_UNFOLLOW_NOT_FOLLOWED);
  }

  await Promise.all([
    userUnfollowing.updateOne({
      $pull: {
        usersFollowed: id,
      },
    }),
    userUnfollowed.updateOne({
      $inc: {
        followersAmount: -1,
      },
    }),
  ]);

  sendSuccess(res);
}
