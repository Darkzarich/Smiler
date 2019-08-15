const crypto = require('crypto');
const User = require('../models/User');
const { generateError, success } = require('./utils/utils');

const validateUser = (user, next) => {
  if (user.login && user.password && user.confirm) {
    if (user.login.length < 3 || user.login.length > 10) {
      generateError('Login length must be 3-10 symbols', 422, next);
    }
    if (user.password.length < 6) {
      generateError('Password length must be not less than 6', 422, next);
    }
    if (user.password !== user.confirm) {
      generateError('Password and password confirm must be equal', 422, next);
    }
    return null;
  }
  return generateError('All fields must be filled.', 422, next);
};

module.exports = {
  register: async (req, res, next) => {
    const user = {
      login: req.body.login,
      password: req.body.password,
      confirm: req.body.confirm,
    };

    validateUser(user, next);

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(user.password, salt, 10000, 512, 'sha512').toString('hex');

    try {
      const newUser = await User.create({
        login: user.login,
        hash,
        salt,
      });

      req.session.userId = newUser.id;
      req.session.userLogin = newUser.login;

      success(res);
    } catch (e) {
      next(e);
    }
  },
  auth: async (req, res, next) => {
    const user = {
      login: req.body.login,
      password: req.body.password,
      confirm: req.body.password,
    };

    validateUser(user, next);

    try {
      const foundUser = await User.findOne({
        login: user.login,
      });

      if (!foundUser) {
        generateError('Invalid username or password');
      }

      const hash = crypto.pbkdf2Sync(user.password, foundUser.salt, 10000, 512, 'sha512').toString('hex');

      if (hash === foundUser.hash) {
        req.session.userId = foundUser.id;
        req.session.userLogin = foundUser.login;

        success(res);
      } else {
        next(new Error('Invalid username or password'));
      }
    } catch (e) {
      next(e);
    }
  },
  logout: async (req, res) => {
    req.session.destroy();
    success(res);
  },
};
