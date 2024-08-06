const User = require('../../models/User');

const {
  ForbiddenError,
  NotFoundError,
  BadRequestError,
} = require('../../errors');
const { sendSuccess } = require('../../utils/responseUtils');

exports.followById = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.session;

  if (id === userId) {
    throw new ForbiddenError('You cannot follow yourself');
  }

  const [userFollowing, userFollowed] = await Promise.all([
    User.findById(userId),
    User.findById(id),
  ]);

  if (!userFollowed) {
    throw new NotFoundError('Followed user is not found');
  }

  if (userFollowing.usersFollowed.includes(id)) {
    throw new BadRequestError('You cannot follow the same author twice');
  }

  await Promise.all([
    userFollowing.updateOne({ $push: { usersFollowed: id } }),
    userFollowed.updateOne({ $inc: { followersAmount: 1 } }),
  ]);

  sendSuccess(res);
};
