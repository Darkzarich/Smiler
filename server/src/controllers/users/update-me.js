const User = require('../../models/User');

const { NotFoundError } = require('../../errors');
const { success } = require('../../utils/utils');

exports.updateMe = async (req, res) => {
  const { userId } = req.session;
  const update = req.body;

  const user = await User.findByIdAndUpdate(userId, update, {
    runValidators: true,
  });

  if (!user) {
    throw new NotFoundError('User is not found');
  }

  success(req, res);
};
