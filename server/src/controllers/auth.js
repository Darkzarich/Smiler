const crypto = require('crypto');
const User = require('../models/User');
const { generateError, success, asyncErrorHandler } = require('./utils/utils');

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

const validateUserRegistration = (user, next) => {
  if (user.login && user.password && user.confirm && user.email) {
    if (user.login.length < 3 || user.login.length > 10) {
      generateError('Login length must be 3-10 symbols', 422, next);
    } else if (user.password.length < 6) {
      generateError('Password length must be not less than 6', 422, next);
    } else if (user.password !== user.confirm) {
      generateError('Password and password confirm must be equal', 422, next);
    } else {
      return 0;
    }
  } else {
    generateError('All fields must be filled.', 422, next);
  }
};

module.exports = {
  signIn: asyncErrorHandler(async (req, res, next) => {
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

      const hash = crypto.pbkdf2Sync(user.password, foundUser.salt, 10000, 512, 'sha512').toString('hex');

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
  }),
  signUp: asyncErrorHandler(async (req, res, next) => {
    // TODO: Rework validation, rework unique email
    const user = {
      email: req.body.email,
      login: req.body.login,
      password: req.body.password,
      confirm: req.body.confirm,
    };

    const status = validateUserRegistration(user, next);

    if (status !== 0) {
      return;
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(user.password, salt, 10000, 512, 'sha512').toString('hex');

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
    } catch (e) {
      next(e);
    }
  }),
  logout: asyncErrorHandler(async (req, res) => {
    const { userId } = req.session;

    req.session.destroy();

    success(req, res, null, {
      userId,
    });
  }),
  current: asyncErrorHandler(async (req, res) => {
    const { userId } = req.session;
    let authState = {};

    if (userId) {
      const user = await User.findById(userId).lean();

      authState = {
        login: user.login,
        isAuth: true,
        rating: user.rating || 0,
        avatar: user.avatar || '',
        email: user.email || '',
        tagsFollowed: user.tagsFollowed || [],
        followersAmount: user.followersAmount,
      };
    } else {
      authState.isAuth = false;
    }

    success(req, res, authState);
  }),
};
