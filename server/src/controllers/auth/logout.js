const { sendSuccess } = require('../../utils/responseUtils');

exports.logout = async (req, res) => {
  req.session.destroy();

  sendSuccess(res);
};
