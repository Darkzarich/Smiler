const { success, asyncErrorHandler } = require('../../utils/utils');

exports.logout = asyncErrorHandler(async (req, res) => {
  const { userId } = req.session;

  req.session.destroy();

  success(req, res, null, {
    userId,
  });
});
