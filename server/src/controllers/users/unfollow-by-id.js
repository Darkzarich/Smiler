const User = require('../../models/User');

const {
  ForbiddenError,
  NotFoundError,
  BadRequestError,
} = require('../../errors');
const { success } = require('../../utils/utils');

exports.unfollowById = async (req, res) => {
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

  success(req, res);
};
