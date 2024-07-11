const crypto = require('crypto');
const User = require('../../models/User');
const {
  success,
  asyncErrorHandler,
  generateError,
} = require('../../utils/utils');

const validateUserAuth = (user, next) => {
  if (user.password && user.email) {
    if (user.password.length < 6) {
      generateError('Password length must be not less than 6', 422, next);
    } else {
      return 0;
    }
  } else {
    generateError('All fields must be filled.', 422, next);
  }
};

exports.signIn = asyncErrorHandler(async (req, res, next) => {
  const user = {
    email: req.body.email,
    password: req.body.password,
  };

  const status = validateUserAuth(user, next);

  if (status !== 0) {
    return;
  }

  try {
    const foundUser = await User.findOne({
      email: user.email,
    }).lean();

    if (!foundUser) {
      generateError('Invalid email or password', 401, next);
      return;
    }

    const hash = crypto
      .pbkdf2Sync(user.password, foundUser.salt, 10000, 512, 'sha512')
      .toString('hex');

    if (hash === foundUser.hash) {
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

      success(req, res, userAuth);
    } else {
      generateError('Invalid email or password', 401, next);
      return;
    }
  } catch (e) {
    next(e);
  }
});
