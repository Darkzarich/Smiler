import { pbkdf2Sync, timingSafeEqual } from 'crypto';
import User from '../../models/User.js';
import { ValidationError, UnauthorizedError } from '../../errors/index.js';
import { sendSuccess } from '../../utils/responseUtils.js';

const validate = (fields) => {
  if (!fields.email || !fields.password) {
    return 'All fields must be filled.';
  }

  if (fields.password.length < 6) {
    return 'Password length must be not less than 6';
  }

  if (!/^[^@]+@[^@]+\.[^@]+$/gm.test(fields.email)) {
    return 'Email must be valid';
  }
};

export async function signIn(req, res) {
  const fields = {
    email: req.body.email,
    password: req.body.password,
  };

  const error = validate(fields);

  if (error) {
    throw new ValidationError(error);
  }

  const foundUser = await User.findOne({
    email: fields.email,
  }).lean();

  if (!foundUser) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const hash = pbkdf2Sync(
    fields.password,
    foundUser.salt,
    10000,
    512,
    'sha512',
  ).toString('hex');

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
