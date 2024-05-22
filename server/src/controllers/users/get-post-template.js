const User = require('../../models/User');

const { generateError, success, asyncErrorHandler } = require('../../utils/utils');

exports.getPostTemplate = asyncErrorHandler(async (req, res, next) => {
  if (req.session.userLogin !== req.params.login) {
    generateError('Can see only your own template', 403, next); return;
  }

  const template = await User.findById(req.session.userId).select('template');

  success(req, res, template.template);
});
