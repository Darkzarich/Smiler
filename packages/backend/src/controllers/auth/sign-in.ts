import { pbkdf2Sync, timingSafeEqual } from 'crypto';
import User from '../../models/User';
import { ValidationError, UnauthorizedError, ERRORS } from '../../errors/index';
import { sendSuccess } from '../../utils/response-utils';

const validate = (fields) => {
  if (!fields.email || !fields.password) {
    return ERRORS.AUTH_FIELDS_REQUIRED;
  }

  if (fields.password.length < 6) {
    return ERRORS.AUTH_PASSWORD_TOO_SHORT;
  }

  if (!/^[^@]+@[^@]+\.[^@]+$/gm.test(fields.email)) {
    return ERRORS.AUTH_INVALID_EMAIL;
  }
};

export async function signIn(req, res) {
  const fields = {
    email: req.body.email,
    password: req.body.password,
  };

  const errorMessage = validate(fields);

  if (errorMessage) {
    throw new ValidationError(errorMessage);
  }

  const foundUser = await User.findOne({
    email: fields.email,
  }).lean();

  if (!foundUser) {
    throw new UnauthorizedError(ERRORS.AUTH_INVALID_CREDENTIALS);
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
    throw new UnauthorizedError(ERRORS.AUTH_INVALID_CREDENTIALS);
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
