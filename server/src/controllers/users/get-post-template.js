const User = require('../../models/User');

const { ForbiddenError } = require('../../errors');
const { sendSuccess } = require('../../utils/responseUtils');

exports.getPostTemplate = async (req, res) => {
  // TODO: Replace with id of the user
  if (req.session.userLogin !== req.params.login) {
    throw new ForbiddenError('Can see only your own template');
  }

  const template = await User.findById(req.session.userId).select('template');

  sendSuccess(res, template.template);
};
