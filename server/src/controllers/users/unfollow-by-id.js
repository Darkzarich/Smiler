import User from '../../models/User.js';
import {
  ForbiddenError,
  NotFoundError,
  BadRequestError,
} from '../../errors/index.js';
import { sendSuccess } from '../../utils/responseUtils.js';

export async function unfollowById(req, res) {
  const { id } = req.params;
  const { userId } = req.session;

  if (id === userId) {
    throw new ForbiddenError('You cannot unfollow yourself');
  }

  const [userUnfollowing, userUnfollowed] = await Promise.all([
    User.findById(userId),
    User.findById(id),
  ]);

  if (!userUnfollowed) {
    throw new NotFoundError('Followed user is not found');
  }

  if (!userUnfollowing.usersFollowed.includes(id)) {
    throw new BadRequestError("You're not following this author");
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
