const crypto = require('crypto');
const User = require('../../models/User');
const {
  success,
  generateError,
  asyncErrorHandler,
  isDuplicateKeyError,
} = require('../../utils/utils');

const validate = (user, next) => {
  if (!user.login || !user.password || !user.confirm || !user.email) {
    generateError('All fields must be filled.', 422, next);

    return false;
  }

  if (user.login.length < 3 || user.login.length > 10) {
    generateError('Login length must be 3-10 symbols', 422, next);

    return false;
  }

  if (user.password.length < 6) {
    generateError('Password length must be not less than 6', 422, next);

    return false;
  }

  if (user.password !== user.confirm) {
    generateError('Password and password confirm must be equal', 422, next);

    return false;
  }

  if (!/^[^@]+@[^@]+\.[^@]+$/gm.test(user.email)) {
    generateError('Email is not valid', 422, next);

    return false;
  }

  return true;
};

exports.signUp = asyncErrorHandler(async (req, res, next) => {
  // TODO: Rework validation, rework unique email
  const user = {
    email: req.body.email,
    login: req.body.login,
    password: req.body.password,
    confirm: req.body.confirm,
  };

  const isValid = validate(user, next);

  if (!isValid) {
    return;
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

    success(req, res, userAuth);
  } catch (error) {
    // Come up with a way to handle it globally
    if (isDuplicateKeyError(error)) {
      generateError(
        'This email or login is already associated with an account',
        422,
        next,
      );

      return;
    }

    throw error;
  }
});
