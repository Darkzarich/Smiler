const { create } = require('./create');
const { deleteById } = require('./delete-by-id');
const { getBySlug } = require('./get-by-slug');
const { getFeed } = require('./get-feed');
const { getList } = require('./get-list');
const { unvoteById } = require('./unvote-by-id');
const { updateById } = require('./update-by-id');
const { upload } = require('./upload');
const { voteById } = require('./vote-by-id');

module.exports = {
  create,
  deleteById,
  getBySlug,
  getFeed,
  getList,
  unvoteById,
  updateById,
  upload,
  voteById,
};
