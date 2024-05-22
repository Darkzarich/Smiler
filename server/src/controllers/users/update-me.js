const User = require('../../models/User');

const { generateError, success, asyncErrorHandler } = require('../../utils/utils');

exports.updateMe = asyncErrorHandler(async (req, res, next) => {
  const { userId } = req.session;
  const update = req.body;

  const user = await User.findByIdAndUpdate(userId, update, {
    runValidators: true,
  });

  if (!user) {
    generateError('User is not found', 404, next); return;
  }

  success(req, res);
});
