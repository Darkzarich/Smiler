import { pbkdf2Sync, timingSafeEqual } from 'crypto';
import User from '../../models/User.js';
import { ValidationError, UnauthorizedError } from '../../errors/index.js';
import { sendSuccess } from '../../utils/responseUtils.js';

const validate = (user) => {
  if (!user.email || !user.password) {
    return 'All fields must be filled.';
  }

  if (user.password.length < 6) {
    return 'Password length must be not less than 6';
  }
};

export async function signIn(req, res) {
  const user = {
    email: req.body.email,
    password: req.body.password,
  };

  const error = validate(user);

  if (error) {
    throw new ValidationError(error);
  }

  const foundUser = await User.findOne({
    email: user.email,
  }).lean();

  if (!foundUser) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const hash = pbkdf2Sync(user.password, foundUser.salt, 10000, 512, 'sha512')
    .toString('hex');

  const isEqual = timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(foundUser.hash),
  );

  if (!isEqual) {
    throw new UnauthorizedError('Invalid email or password');
  }

  req.session.userId = foundUser._id;

  // TODO: Maybe move to getters of the model
  const userAuth = {
    id: foundUser._id,
    login: foundUser.login,
    isAuth: true,
    rating: foundUser.rating || 0,
    avatar: foundUser.avatar || '',
    email: foundUser.email || '',
    tagsFollowed: foundUser.tagsFollowed || [],
    followersAmount: foundUser.followersAmount,
  };

  sendSuccess(res, userAuth);
}
