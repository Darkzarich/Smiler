import User from '../../models/User.js';
import { NotFoundError } from '../../errors/index.js';
import { sendSuccess } from '../../utils/responseUtils.js';

export async function updateMe(req, res) {
  const { userId } = req.session;
  const update = req.body;

  const updatedUser = await User.findByIdAndUpdate(userId, update, {
    runValidators: true,
    new: true,
  });

  if (!updatedUser) {
    throw new NotFoundError('User is not found');
  }

  sendSuccess(res, updatedUser);
}
