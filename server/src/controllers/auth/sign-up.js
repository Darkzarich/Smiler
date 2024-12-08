import crypto from 'crypto';
import User from '../../models/User.js';
import { ValidationError, ConflictError, ERRORS } from '../../errors/index.js';
import { isDuplicateKeyError } from '../../utils/check-mongo-db-error.js';
import { sendSuccess } from '../../utils/responseUtils.js';

/** Validate user sign up, return error message or nothing */
const validate = (user) => {
  if (!user.login || !user.password || !user.confirm || !user.email) {
    return ERRORS.AUTH_FIELDS_REQUIRED;
  }

  if (user.login.length < 3 || user.login.length > 15) {
    return ERRORS.AUTH_LOGIN_TOO_SHORT;
  }

  if (user.password.length < 6) {
    return ERRORS.AUTH_PASSWORD_TOO_SHORT;
  }

  if (user.password !== user.confirm) {
    return ERRORS.AUTH_PASSWORDS_NOT_MATCH;
  }

  if (!/^[^@]+@[^@]+\.[^@]+$/gm.test(user.email)) {
    return ERRORS.AUTH_INVALID_EMAIL;
  }
};

export async function signUp(req, res) {
  const user = {
    email: req.body.email,
    login: req.body.login,
    password: req.body.password,
    confirm: req.body.confirm,
  };

  const errorMessage = validate(user);

  if (errorMessage) {
    throw new ValidationError(errorMessage);
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(user.password, salt, 10000, 512, 'sha512')
    .toString('hex');

  try {
    const newUser = await User.create({
      login: user.login,
      email: user.email,
      hash,
      salt,
    });

    req.session.userId = newUser._id;

    const userAuth = {
      id: newUser._id,
      login: newUser.login,
      isAuth: true,
      rating: newUser.rating,
      avatar: newUser.avatar,
      email: newUser.email,
      tagsFollowed: newUser.tagsFollowed,
      followersAmount: newUser.followersAmount,
    };

    sendSuccess(res, userAuth);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new ConflictError(ERRORS.AUTH_CONFLICT);
    }

    throw error;
  }
}
