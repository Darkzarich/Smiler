const User = require('../../models/User');

const { NotFoundError } = require('../../errors');
const { sendSuccess } = require('../../utils/responseUtils');

exports.updateMe = async (req, res) => {
  const { userId } = req.session;
  const update = req.body;

  const user = await User.findByIdAndUpdate(userId, update, {
    runValidators: true,
  });

  if (!user) {
    throw new NotFoundError('User is not found');
  }

  sendSuccess(res);
};
