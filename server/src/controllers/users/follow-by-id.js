const User = require('../../models/User');

const { generateError, success, asyncErrorHandler } = require('../../utils/utils');

exports.followById = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const { userId } = req.session;

  if (id === userId) {
    generateError('You cannot follow yourself', 422, next);
    return;
  }

  Promise.all([
    User.findById(userId),
    User.findById(id),
  ]).then((users) => {
    const userFollowing = users[0];
    const userFollowed = users[1];

    if (userFollowed) {
      if (userFollowing.usersFollowed.includes(id)) {
        generateError('You cannot follow the same author twice', 422, next);
        return;
      }

      Promise.all([
        userFollowing.updateOne({
          $push: {
            usersFollowed: id,
          },
        }),
        userFollowed.updateOne({
          $inc: {
            followersAmount: 1,
          },
        }),
      ]).then(() => {
        success(req, res);
      }).catch((e) => {
        next(e);
      });
    } else {
      generateError('User is not found', 404, next);
    }
  }).catch((e) => {
    next(e);
  });
});
