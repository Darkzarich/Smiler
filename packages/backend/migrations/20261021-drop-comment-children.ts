/*
 * Drop comments.children and the comments index on { post: 1 }.
 *
 * Touches: comments.
 *
 * Replies are found through `parent` since the comment tree is read with one
 * $graphLookup, and nothing reads or writes `children` any more. Old documents
 * still carry the array, some of it ids of replies deleted since.
 *
 * { post: 1, parent: 1, rating: -1 } replaced { post: 1 } and serves every
 * query the old one did. Mongoose only creates the indexes a model declares
 * and never drops one it stopped declaring, so this drops the old one, after
 * making sure the new one is there.
 */
import { defineMigration } from '@smiler/mongodb-migrator';
import type { AnyBulkWriteOperation, ObjectId } from 'mongodb';

interface CommentDocument {
  _id: ObjectId;
  parent?: ObjectId;
  children?: ObjectId[];
}

export default defineMigration({
  // Nothing reads what it drops
  critical: false,

  async up({ db }) {
    const comments = db.collection<CommentDocument>('comments');

    // The same key and options as the Comment model declares, so this is a
    // no-op once the app has started and builds it otherwise
    await comments.createIndex({ post: 1, parent: 1, rating: -1 });

    const unset = await comments.updateMany(
      { children: { $exists: true } },
      { $unset: { children: '' } },
    );
    const droppedPostIndex = await comments.indexExists('post_1');

    if (droppedPostIndex) {
      await comments.dropIndex('post_1');
    }

    return { unsetChildren: unset.modifiedCount, droppedPostIndex };
  },

  // Rebuilt from `parent`, in the order the replies were written. Ids of
  // replies deleted before the migration ran do not come back, and nothing
  // ever needed them. The compound index stays: the older release ignores it.
  async down({ db }) {
    const comments = db.collection<CommentDocument>('comments');

    await comments.createIndex({ post: 1 });

    const repliesByParent = new Map(
      (
        await comments
          .aggregate<{
            _id: ObjectId;
            children: ObjectId[];
          }>([
            { $match: { parent: { $exists: true, $ne: null } } },
            { $sort: { _id: 1 } },
            { $group: { _id: '$parent', children: { $push: '$_id' } } },
          ])
          .toArray()
      ).map(({ _id: parent, children }) => [parent.toHexString(), children]),
    );

    const writes: AnyBulkWriteOperation<CommentDocument>[] = [];

    for await (const { _id: id } of comments.find(
      {},
      { projection: { _id: 1 } },
    )) {
      writes.push({
        updateOne: {
          filter: { _id: id },
          update: {
            $set: { children: repliesByParent.get(id.toHexString()) ?? [] },
          },
        },
      });
    }

    const result =
      writes.length > 0
        ? await comments.bulkWrite(writes, { ordered: false })
        : undefined;

    return { restoredChildren: result?.modifiedCount ?? 0 };
  },
});
