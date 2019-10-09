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
    // TODO: validate title, sections just like in posts

    const { sections } = req.body;
    const { tags } = req.body;
    const { title } = req.body;

    if (req.session.userLogin !== req.params.login) {
      generateError('Can save template only for yourself', 403, next); return;
    }

    if (tags) {
      if (tags.length > consts.POST_MAX_TAGS) { generateError('Too many tags', 422, next); return; }
      if (tags.find(el => el.length > consts.POST_MAX_TAG_LEN)) { generateError('Exceeded max length of a tag', 422, next); return; }
    }

    const userTemplate = await User.findById(req.session.userId).select('template');

    userTemplate.template.title = title || userTemplate.template.title;
    userTemplate.template.tags = tags || userTemplate.template.tags;
    userTemplate.template.sections = sections || userTemplate.template.sections;

    try {
      userTemplate.markModified('template');
      await userTemplate.save();
      success(res);
    } catch (e) {
      next(e);
    }
  },
  deleteUserPostTemplatePicture: async (req, res, next) => {
    const { login } = req.params;
    const { hash } = req.params;

    if (req.session.userLogin !== login) {
      generateError('Can delete image only for yourself', 403, next); return;
    }
    if (!hash) { generateError('Hash is required for this operation', 422, next); return; }

    const userTemplate = await User.findById(req.session.userId).select('template');

    const foundSection = userTemplate.template.sections
      .find(sec => sec.hash === hash);

    userTemplate.template.sections.indexOf(foundSection);

    if (foundSection) {
      if (foundSection.type === consts.POST_SECTION_TYPES.PICTURE && foundSection.isFile === true) {
        const { url } = foundSection;

        // async function removeSection() {
        //   await User.findByIdAndUpdate(req.session.userId, {
        //     $pull: {
        //       'template.sections': foundSection,
        //     },
        //   });
        // }

        const delCb = (err) => {
          if (err) generateError(err, 500, next);
          else success(res);
        };

        fs.exists(url, (exists) => {
          if (exists) {
            fs.unlink(url, (err) => {
              if (err) {
                generateError(err, 500, next);
              } else {
                userTemplate.deleteSection(foundSection, delCb);
              }
            });
          } else {
            userTemplate.deleteSection(foundSection, delCb);
          }
        });
      } else {
        generateError('This operation cannot be done for not file picture sections or not pictures');
      }
    } else {
      generateError('Section with given hash is not found', 404, next);
    }
  },
};
