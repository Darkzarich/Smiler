const crypto = require('crypto');
const fs = require('fs');

const User = require('../models/User');

const { generateError, success } = require('./utils/utils');
const consts = require('../const/const');

const validateUser = (user, next) => {
  if (user.login && user.password && user.confirm) {
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
  register: async (req, res, next) => {
    const user = {
      login: req.body.login,
      password: req.body.password,
      confirm: req.body.confirm,
    };

    const status = validateUser(user, next);

    if (status !== 0) {
      return;
    }

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

    const status = validateUser(user, next);

    if (status !== 0) {
      return;
    }

    try {
      const foundUser = await User.findOne({
        login: user.login,
      });

      if (!foundUser) {
        generateError('Invalid username or password', 401, next);
        return;
      }

      const hash = crypto.pbkdf2Sync(user.password, foundUser.salt, 10000, 512, 'sha512').toString('hex');

      if (hash === foundUser.hash) {
        req.session.userId = foundUser.id;
        req.session.userLogin = foundUser.login;

        success(res);
      } else {
        generateError('Invalid username or password', 401, next);
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
