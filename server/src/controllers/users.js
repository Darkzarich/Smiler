/* eslint-disable no-underscore-dangle */
const crypto = require('crypto');
const fs = require('fs');

const User = require('../models/User');

const { generateError, success } = require('./utils/utils');
const consts = require('../const/const');

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

module.exports = {
  getUser: async (req, res, next) => {
    const { login } = req.params;
    const user = await User.findOne({
      login,
    }).select('login rating bio avatar createdAt');
    if (user) {
      success(res, user);
    } else {
      generateError('User is not found', 404, next);
    }
  },
  updateUser: async (req, res, next) => {
    const { login } = req.params;
    const { userId } = req.session;
    const { bio } = req.body;
    const { avatar } = req.body;

    if (bio && bio.length > consts.USER_MAX_BIO_LENGTH) {
      generateError(`bio can't be longer than ${consts.USER_MAX_BIO_LENGTH}`, 422, next); return;
    } if (avatar && avatar.length > consts.USER_MAX_AVATAR_LENGTH) {
      generateError(`Avatar link can't be longer than ${consts.USER_MAX_AVATAR_LENGTH}`, 422, next); return;
    }

    const user = await User.findOne({
      login,
    });

    if (user) {
      if (user.id.toString() !== userId) {
        generateError('Can edit only information for yourself', 403, next);
      } else {
        user.bio = bio || user.bio;
        user.avatar = avatar || user.avatar;

        await user.save();

        success(res);
      }
    } else {
      generateError('User is not found', 404, next);
    }
  },
  register: async (req, res, next) => {
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

      success(res, userAuth);
    } catch (e) {
      next(e);
    }
  },
  auth: async (req, res, next) => {
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

        const userAuth = {
          login: foundUser.login,
          isAuth: true,
          rating: foundUser.rating || 0,
          avatar: foundUser.avatar || '',
          email: foundUser.email || '',
        };

        success(res, userAuth);
      } else {
        generateError('Invalid email or password', 401, next);
        return;
      }
    } catch (e) {
      next(e);
    }
  },
  logout: async (req, res) => {
    req.session.destroy();
    success(res);
  },
  getAuth: async (req, res) => {
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
      };
    } else {
      authState.isAuth = false;
    }

    success(res, authState);
  },
  getUserPostTemplate: async (req, res, next) => {
    if (req.session.userLogin !== req.params.login) {
      generateError('Can see only your own template', 403, next); return;
    }

    const template = await User.findById(req.session.userId).select('template');

    success(res, template.template);
  },
  updateUserPostTemplate: async (req, res, next) => {
    let error = false;
    const deleteParam = req.body.delete || [];

    if (deleteParam.length > consts.POST_ATTACHMENTS_LIMIT) {
      generateError('Too big delete array', 422, next); return;
    }

    const toDeleteArray = [].concat(req.body.delete);

    if (req.session.userLogin !== req.params.login) {
      generateError('Can save template only for yourself', 403, next); return;
    }

    const template = await User.findById(req.session.userId).select('template');

    template.template.title = req.body.title || req.body.title === '' ? req.body.title : template.template.title;
    template.template.body = req.body.body || req.body.body === '' ? req.body.body : template.template.body;

    toDeleteArray.forEach((el) => {
      if (el && template.template.attachments.length !== 0) {
        const index = template.template.attachments.indexOf(el);

        if (index !== -1) {
          const deleted = template.template.attachments.splice(index, 1);
          fs.exists(deleted[0], (exists) => {
            if (exists) {
              fs.unlink(deleted[0], (err) => {
                if (err) {
                  error = true;
                  template.template.attachments.push(deleted[0]);
                  template.markModified('template');
                  template.save();
                  generateError(`Could't delete an attachment: ${deleted[0]}`, 500, next);
                }
              });
            }
          });
        }
      }
    });

    if (!error) {
      template.markModified('template');
      await template.save();
      success(res);
    }
  },
};
