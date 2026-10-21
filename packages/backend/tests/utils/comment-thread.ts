import { Types } from 'mongoose';
import { CommentModel } from '@models/Comment';
import { generateRandomComment } from '@test-data-generators';

/** A thread `depth` comments deep, each one replying to the one before.
 * Returns their ids, the top-level comment first. */
export async function insertThread({
  post,
  author,
  depth,
}: {
  post: Types.ObjectId;
  author: Types.ObjectId;
  depth: number;
}) {
  const ids = Array.from({ length: depth }, () => new Types.ObjectId());

  await CommentModel.insertMany(
    ids.map((_id, level) => ({
      ...generateRandomComment({
        author,
        post,
        parent: ids[level - 1],
      }),
      _id,
    })),
  );

  return ids;
}
