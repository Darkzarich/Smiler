import User from '../../models/User';
import { NotFoundError, ERRORS } from '../../errors/index';
import { sendSuccess } from '../../utils/response-utils';

export async function updateMe(req, res) {
  const { userId } = req.session;
  const update = req.body;

  const updatedUser = await User.findByIdAndUpdate(userId, update, {
    runValidators: true,
    new: true,
    lean: true,
  });

  if (!updatedUser) {
    throw new NotFoundError(ERRORS.USER_NOT_FOUND);
  }

  sendSuccess(res, updatedUser);
}
