const User = require('../../models/User');

const {
  generateError,
  success,
  asyncErrorHandler,
} = require('../../utils/utils');

exports.getByLogin = asyncErrorHandler(async (req, res, next) => {
  const { login } = req.params;
  const { userId } = req.session;
  const { userLogin } = req.session;

  let promises;

  if (userId && login !== userLogin) {
    promises = Promise.all([
      User.findOne({
        login,
      }).select('login rating bio avatar createdAt followersAmount'),
      User.findById(userId),
    ]);
  } else {
    promises = Promise.all([
      User.findOne({
        login,
      }).select('login rating bio avatar createdAt followersAmount'),
    ]);
  }

  promises
    .then((users) => {
      const requestedUser = users[0];
      const requestingUser = users[1];

      if (requestedUser) {
        const response = {
          ...requestedUser.toJSON(),
          isFollowed: requestingUser
            ? requestingUser.isFollowed(requestedUser._id)
            : false,
        };

        success(req, res, response);
      } else {
        generateError('User is not found', 404, next);
      }
    })
    .catch((e) => {
      next(e);
    });
});
