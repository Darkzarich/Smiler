const crypto = require('crypto');
const User = require('../../models/User');
const { ValidationError, UnauthorizedError } = require('../../errors');
const { sendSuccess } = require('../../utils/responseUtils');

const validate = (user) => {
  if (!user.email || !user.password) {
    return 'All fields must be filled.';
  }

  if (user.password.length < 6) {
    return 'Password length must be not less than 6';
  }
};

exports.signIn = async (req, res) => {
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

  const hash = crypto
    .pbkdf2Sync(user.password, foundUser.salt, 10000, 512, 'sha512')
    .toString('hex');

  const isEqual = crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(foundUser.hash),
  );

  if (!isEqual) {
    throw new UnauthorizedError('Invalid email or password');
  }

  req.session.userId = foundUser._id;
  req.session.userLogin = foundUser.login;

  // TODO: Maybe move to getters of the model
  const userAuth = {
    login: foundUser.login,
    isAuth: true,
    rating: foundUser.rating || 0,
    avatar: foundUser.avatar || '',
    email: foundUser.email || '',
    tagsFollowed: foundUser.tagsFollowed || [],
    followersAmount: foundUser.followersAmount,
  };

  sendSuccess(res, userAuth);
};
