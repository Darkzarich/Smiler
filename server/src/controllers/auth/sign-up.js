import crypto from 'crypto';
import User from '../../models/User.js';
import { ValidationError, ConflictError } from '../../errors/index.js';
import { isDuplicateKeyError } from '../../utils/check-mongo-db-error.js';
import { sendSuccess } from '../../utils/responseUtils.js';

/** Validate user sign up, return error message or nothing */
const validate = (user) => {
  if (!user.login || !user.password || !user.confirm || !user.email) {
    return 'All fields must be filled';
  }

  if (user.login.length < 3 || user.login.length > 10) {
    return 'Login length must be 3-10 symbols';
  }

  if (user.password.length < 6) {
    return 'Password length must be not less than 6';
  }

  if (user.password !== user.confirm) {
    return 'Password and password confirm must be equal';
  }

  if (!/^[^@]+@[^@]+\.[^@]+$/gm.test(user.email)) {
    return 'Email is not valid';
  }
};

export async function signUp (req, res) {
  const user = {
    email: req.body.email,
    login: req.body.login,
    password: req.body.password,
    confirm: req.body.confirm,
  };

  const error = validate(user);

  if (error) {
    throw new ValidationError(error);
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

    req.session.userId = newUser.id;
    req.session.userLogin = newUser.login;

    const userAuth = {
      login: req.session.userLogin,
      isAuth: true,
      rating: newUser.rating,
      avatar: newUser.avatar,
      email: newUser.email,
    };

    sendSuccess(res, userAuth);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new ConflictError(
        'This email or login is already associated with an account',
      );
    }

    throw error;
  }
};
