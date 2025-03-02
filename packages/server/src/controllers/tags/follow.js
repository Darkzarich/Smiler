import User from '../../models/User.js';
import { ValidationError, ERRORS } from '../../errors/index.js';
import { POST_MAX_TAG_LEN } from '../../constants/index.js';
import { sendSuccess } from '../../utils/response-utils.js';

export async function follow(req, res) {
  const { tag } = req.params;
  const { userId } = req.session;

  if (tag.length > POST_MAX_TAG_LEN) {
    throw new ValidationError(ERRORS.POST_TAG_MAX_LEN_EXCEEDED);
  }

  await User.findByIdAndUpdate(userId, {
    $addToSet: {
      tagsFollowed: tag,
    },
  });

  sendSuccess(res);
}
