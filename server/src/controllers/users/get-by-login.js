const User = require('../../models/User');
const { NotFoundError } = require('../../errors');
const { success } = require('../../utils/utils');

exports.getByLogin = async (req, res) => {
  const { login } = req.params;
  const { userId, userLogin } = req.session;

  const promises = [
    User.findOne({
      login,
    }).select('login rating bio avatar createdAt followersAmount'),
  ];

  // TODO: Replace with id of the user
  if (userId && login !== userLogin) {
    promises.push(User.findById(userId));
  }

  const [requestedUser, requestingUser] = await Promise.all(promises);

  if (!requestedUser) {
    throw new NotFoundError('User is not found');
  }

  const response = {
    ...requestedUser.toJSON(),
    isFollowed: requestingUser
      ? requestingUser.isFollowed(requestedUser._id)
      : false,
  };

  success(req, res, response);
};
