const { deletePostTemplatePicture } = require('./delete-post-template-picture');
const { followById } = require('./follow-by-id');
const { getByLogin } = require('./get-by-login');
const { getPostTemplate } = require('./get-post-template');
const { getSettings } = require('./get-settings');
const { unfollowById } = require('./unfollow-by-id');
const { updateMe } = require('./update-me');
const { updatePostTemplate } = require('./update-post-template');

module.exports = {
  deletePostTemplatePicture,
  followById,
  getByLogin,
  getPostTemplate,
  getSettings,
  unfollowById,
  updateMe,
  updatePostTemplate,
};
