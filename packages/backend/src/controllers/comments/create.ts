import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { CommentModel } from '@models/Comment';
import { PostModel } from '@models/Post';
import { COMMENT_MAX_DEPTH } from '@constants/index';
import { NotFoundError, ERRORS } from '@errors';
import { sendSuccess } from '@utils/response-utils';
import type { CommentCreateBody } from '@validators/comments';

async function findWithAncestors(commentId: string, postId: string) {
  const [comment] = await CommentModel.aggregate<{
    _id: Types.ObjectId;
    ancestors: { _id: Types.ObjectId; distance: number }[];
  }>([
    {
      $match: {
        _id: new Types.ObjectId(commentId),
        post: new Types.ObjectId(postId),
      },
    },
    {
      $graphLookup: {
        from: CommentModel.collection.name,
        startWith: '$parent',
        connectFromField: 'parent',
        connectToField: '_id',
        as: 'ancestors',
        depthField: 'distance',
      },
    },
    { $project: { 'ancestors._id': 1, 'ancestors.distance': 1 } },
  ]);

  return comment;
}

/** A reply that would nest deeper than `COMMENT_MAX_DEPTH` goes under the
 * ancestor one level above the limit instead, next to the comment it answers. */
function placeReply(repliedTo: Awaited<ReturnType<typeof findWithAncestors>>) {
  const depth = repliedTo.ancestors.length + 1;

  if (depth < COMMENT_MAX_DEPTH) {
    return { parent: repliedTo._id };
  }

  const parent = repliedTo.ancestors.find(
    (ancestor) => ancestor.distance === depth - COMMENT_MAX_DEPTH,
  )!;

  return { parent: parent._id, replyTo: repliedTo._id };
}

export async function create(
  req: Request<unknown, unknown, CommentCreateBody>,
  res: Response,
) {
  const { userId } = req.session;
  const { body, parent, post: postId } = req.body;

  const post = await PostModel.findById(postId).lean();

  if (!post) {
    throw new NotFoundError(ERRORS.POST_NOT_FOUND);
  }

  if (!parent) {
    const [comment] = await Promise.all([
      CommentModel.create({
        post: postId,
        body,
        author: userId,
      }),
      PostModel.increaseCommentCount(postId),
    ]);

    sendSuccess(res, comment.toObject({ versionKey: false }));

    return;
  }

  const repliedTo = await findWithAncestors(parent, postId);

  if (!repliedTo) {
    throw new NotFoundError(ERRORS.COMMENT_PARENT_COMMENT_NOT_FOUND);
  }

  const place = placeReply(repliedTo);

  const comment = await CommentModel.create({
    post: postId,
    body,
    author: userId,
    ...place,
  });

  const [replyTo] = await Promise.all([
    place.replyTo && CommentModel.findReplyTo(place.replyTo),
    CommentModel.updateOne(
      { _id: place.parent },
      { $push: { children: comment._id.toString() } },
    ),
    PostModel.increaseCommentCount(postId),
  ]);

  sendSuccess(res, {
    ...comment.toObject({ versionKey: false }),
    ...(replyTo && { replyTo }),
  });
}
