import User from '../../models/User.js';
import { ValidationError } from '../../errors/index.js';
import { TAGS_MAX_LENGTH } from '../../constants/index.js';
import { sendSuccess } from '../../utils/responseUtils.js';

export async function follow (req, res) {
  const { tag } = req.params;
  const { userId } = req.session;

  if (tag.length > TAGS_MAX_LENGTH) {
    throw new ValidationError(
      `The tag can't be longer than ${TAGS_MAX_LENGTH}`,
    );
  }

  await User.findByIdAndUpdate(userId, {
    $addToSet: {
      tagsFollowed: tag,
    },
  });

  sendSuccess(res);
};
