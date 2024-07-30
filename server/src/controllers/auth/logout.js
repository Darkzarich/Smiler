const { success } = require('../../utils/utils');

exports.logout = async (req, res) => {
  req.session.destroy();

  success(req, res);
};
