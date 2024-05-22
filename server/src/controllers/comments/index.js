const { create } = require('./create');
const { deleteById } = require('./delete-by-id');
const { updateById } = require('./update-by-id');
const { getList } = require('./get-list');
const { unvoteById } = require('./unvote-by-id');
const { voteById } = require('./vote-by-id');

module.exports = {
  create,
  deleteById,
  updateById,
  getList,
  unvoteById,
  voteById,
};
