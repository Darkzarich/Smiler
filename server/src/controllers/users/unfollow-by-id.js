const User = require('../../models/User');

const { generateError, success } = require('../../utils/utils');

exports.unfollowById = async (req, res, next) => {
  const { id } = req.params;
  const { userId } = req.session;

  if (id === userId) {
    generateError('You cannot unfollow yourself', 422, next);
    return;
  }

  Promise.all([User.findById(userId), User.findById(id)])
    .then((users) => {
      const userUnfollowing = users[0];
      const userUnfollowed = users[1];

      if (userUnfollowed) {
        if (!userUnfollowing.usersFollowed.includes(id)) {
          generateError("You're not following this author", 404, next);
          return;
        }

        Promise.all([
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
        ])
          .then(() => {
            success(req, res);
          })
          .catch((e) => {
            next(e);
          });
      } else {
        generateError('User is not found', 404, next);
      }
    })
    .catch((e) => {
      next(e);
    });
};
