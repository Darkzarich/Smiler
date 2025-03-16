import User from '../../models/User';
import Rate from '../../models/Rate';
import Comment from '../../models/Comment';
import { COMMENT_RATE_VALUE } from '../../constants/index';
import { ForbiddenError, NotFoundError, ERRORS } from '../../errors/index';
import { sendSuccess } from '../../utils/response-utils';

export async function voteById(req, res) {
  const { userId } = req.session;
  const { id: commentId } = req.params;
  const { negative } = req.body;

  const targetComment = await Comment.findOne({
    _id: commentId,
    deleted: false,
  })
    .select({ author: 1 })
    .lean();

  if (!targetComment) {
    throw new NotFoundError(ERRORS.COMMENT_NOT_FOUND);
  }

  if (targetComment.author.toString() === userId) {
    throw new ForbiddenError(ERRORS.COMMENT_CANT_RATE_OWN);
  }

  const currentUser = await User.findById(userId).populate('rates');

  const ratedForCurrentUser = currentUser.isRated(targetComment._id.toString());

  if (ratedForCurrentUser.result) {
    throw new ForbiddenError(ERRORS.COMMENT_CANT_RATE_ALREADY_RATED);
  }

  const rateValue = negative ? -COMMENT_RATE_VALUE : COMMENT_RATE_VALUE;

  const newRate = await Rate.create({
    target: targetComment._id,
    targetModel: 'Comment',
    negative,
  });

  const [updatedComment] = await Promise.all([
    Comment.findByIdAndUpdate(
      targetComment._id,
      { $inc: { rating: rateValue } },
      { new: true, lean: true },
    ),
    User.updateOne({ _id: currentUser.id }, { $push: { rates: newRate.id } }),
    User.updateOne(
      { _id: targetComment.author },
      { $inc: { rating: rateValue } },
    ),
  ]);

  sendSuccess(res, updatedComment);
}
