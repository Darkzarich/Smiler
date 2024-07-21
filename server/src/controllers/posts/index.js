const { create } = require('./create');
const { deleteById } = require('./delete-by-id');
const { getBySlug } = require('./get-by-slug');
const { getByAuthor } = require('./get-by-author');
const { getFeed } = require('./get-feed');
const { all } = require('./categories/all');
const { blowing } = require('./categories/blowing');
const { recent } = require('./categories/recent');
const { today } = require('./categories/today');
const { topThisWeek } = require('./categories/top-this-week');
const { search } = require('./search');
const { unvoteById } = require('./unvote-by-id');
const { updateById } = require('./update-by-id');
const { upload } = require('./upload');
const { voteById } = require('./vote-by-id');

module.exports = {
  create,
  deleteById,
  getBySlug,
  getByAuthor,
  getFeed,
  search,
  unvoteById,
  updateById,
  upload,
  voteById,
  all,
  blowing,
  recent,
  topThisWeek,
  today,
};
