import User from '../../models/User.js';
import { NotFoundError } from '../../errors/index.js';
import { sendSuccess } from '../../utils/responseUtils.js';

export async function getByLogin(req, res) {
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

  sendSuccess(res, response);
}
