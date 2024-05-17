/* eslint-disable no-underscore-dangle */
const fs = require('fs');
const path = require('path');

const User = require('../models/User');

const { generateError, success, asyncErrorHandler } = require('./utils/utils');
const consts = require('../const/const');

module.exports = {
  getUser: asyncErrorHandler(async (req, res, next) => {
    const { login } = req.params;
    const { userId } = req.session;
    const { userLogin } = req.session;

    let promises;

    if (userId && login !== userLogin) {
      promises = Promise.all([
        User.findOne({
          login,
        }).select('login rating bio avatar createdAt followersAmount'),
        User.findById(userId),
      ]);
    } else {
      promises = Promise.all([
        User.findOne({
          login,
        }).select('login rating bio avatar createdAt followersAmount'),
      ]);
    }

    promises.then((users) => {
      const requestedUser = users[0];
      const requestingUser = users[1];

      if (requestedUser) {
        const response = {
          ...requestedUser.toJSON(),
          isFollowed: requestingUser ? requestingUser.isFollowed(requestedUser._id) : false,
        };

        success(req, res, response);
      } else {
        generateError('User is not found', 404, next);
      }
    }).catch((e) => {
      next(e);
    });
  }),
  updateUser: asyncErrorHandler(async (req, res, next) => {
    const { userId } = req.session;
    const update = req.body;

    if (update.bio && update.bio.length > consts.USER_MAX_BIO_LENGTH) {
      generateError(`bio can't be longer than ${consts.USER_MAX_BIO_LENGTH}`, 422, next); return;
    }

    if (update.avatar && update.avatar.length > consts.USER_MAX_AVATAR_LENGTH) {
      generateError(`Avatar link can't be longer than ${consts.USER_MAX_AVATAR_LENGTH}`, 422, next); return;
    }

    const user = await User.findByIdAndUpdate(userId, update, {
      runValidators: true,
    });

    if (!user) {
      generateError('User is not found', 404, next); return;
    }

    success(req, res);
  }),
  getFollowing: asyncErrorHandler(async (req, res, next) => {
    const { userId } = req.session;

    const user = await User.findById(userId).populate('usersFollowed', 'login avatar id');

    if (user) {
      const following = {
        authors: user.usersFollowed,
        tags: user.tagsFollowed,
      };

      success(req, res, following);
    } else {
      generateError('User is not found', 404, next);
    }
  }),
  follow: asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const { userId } = req.session;

    if (id === userId) {
      generateError('You cannot follow yourself', 422, next);
      return;
    }

    Promise.all([
      User.findById(userId),
      User.findById(id),
    ]).then((users) => {
      const userFollowing = users[0];
      const userFollowed = users[1];

      if (userFollowed) {
        if (userFollowing.usersFollowed.includes(id)) {
          generateError('You cannot follow the same author twice', 422, next);
          return;
        }

        Promise.all([
          userFollowing.updateOne({
            $push: {
              usersFollowed: id,
            },
          }),
          userFollowed.updateOne({
            $inc: {
              followersAmount: 1,
            },
          }),
        ]).then(() => {
          success(req, res);
        }).catch((e) => {
          next(e);
        });
      } else {
        generateError('User is not found', 404, next);
      }
    }).catch((e) => {
      next(e);
    });
  }),
  unfollow: asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const { userId } = req.session;

    if (id === userId) {
      generateError('You cannot unfollow yourself', 422, next);
      return;
    }

    Promise.all([
      User.findById(userId),
      User.findById(id),
    ]).then((users) => {
      const userUnfollowing = users[0];
      const userUnfollowed = users[1];

      if (userUnfollowed) {
        if (!userUnfollowing.usersFollowed.includes(id)) {
          generateError('You\'re not following this author', 404, next);
          return;
        }

        Promise.all([
          userUnfollowing.updateOne({
            $pull: {
              usersFollowed: id,
            },
          }),
          userUnfollowed.updateOne({
            $inc: {
              followersAmount: -1,
            },
          }),
        ]).then(() => {
          success(req, res);
        }).catch((e) => {
          next(e);
        });
      } else {
        generateError('User is not found', 404, next);
      }
    }).catch((e) => {
      next(e);
    });
  }),
  getUserPostTemplate: asyncErrorHandler(async (req, res, next) => {
    if (req.session.userLogin !== req.params.login) {
      generateError('Can see only your own template', 403, next); return;
    }

    const template = await User.findById(req.session.userId).select('template');

    success(req, res, template.template);
  }),
  updateUserPostTemplate: asyncErrorHandler(async (req, res, next) => {
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
      success(req, res);
    } catch (e) {
      next(e);
    }
  }),
  deleteUserPostTemplatePicture: asyncErrorHandler(async (req, res, next) => {
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
          else success(req, res);
        };

        const absolutePath = path.join(process.cwd(), url);

        fs.exists(absolutePath, (exists) => {
          if (exists) {
            fs.unlink(absolutePath, (err) => {
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
  }),
};
