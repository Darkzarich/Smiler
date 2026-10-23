/*
 * Rescale comments.rating from half a point per vote to one point per vote.
 *
 * Touches: comments (reads rates).
 *
 * A vote used to move both the comment and its author by 0.5. Now it moves
 * the comment by 1 and its author by 0.5, so authors' ratings stay as they
 * are and only the comments change.
 *
 * Every vote has a document in `rates`, so a comment's rating becomes its
 * upvotes minus its downvotes. Votes cast between the deploy and this run are
 * counted like any other. A comment with no rates has no votes on record: its
 * rating is doubled, which leaves a 0 at 0 and gives the comments from before
 * the field existed a 0.
 */
import { defineMigration } from '@smiler/mongodb-migrator';
import type { AnyBulkWriteOperation, ObjectId } from 'mongodb';

interface CommentDocument {
  _id: ObjectId;
  rating?: number;
}

export default defineMigration({
  // Comments show half their score until it runs, and it recounts the votes
  // cast in the meantime along with the rest
  critical: false,

  async up({ db }) {
    const comments = db.collection<CommentDocument>('comments');

    const netVotes = new Map(
      (
        await db
          .collection('rates')
          .aggregate<{ _id: ObjectId; net: number }>([
            { $match: { targetModel: 'Comment' } },
            {
              $group: {
                _id: '$target',
                net: { $sum: { $cond: ['$negative', -1, 1] } },
              },
            },
          ])
          .toArray()
      ).map((group) => [group._id.toHexString(), group.net]),
    );

    let fromVotes = 0;
    let doubled = 0;
    let unchanged = 0;
    // Not 0.5 × their votes before the change: votes cast after the deploy, or a
    // stored rating that had drifted. Either way the votes win.
    const offBefore: { _id: ObjectId; before: number; votes: number }[] = [];
    const writes: AnyBulkWriteOperation<CommentDocument>[] = [];

    for await (const comment of comments.find(
      {},
      { projection: { _id: 1, rating: 1 } },
    )) {
      const net = netVotes.get(comment._id.toHexString());
      const before = comment.rating ?? 0;
      const after = net === undefined ? before * 2 : net;

      if (net === undefined) {
        doubled += 1;
      } else {
        fromVotes += 1;

        if (net * 0.5 !== before && offBefore.length < 20) {
          offBefore.push({ _id: comment._id, before, votes: net });
        }
      }

      if (after === comment.rating) {
        unchanged += 1;
      } else {
        writes.push({
          updateOne: {
            filter: { _id: comment._id },
            update: { $set: { rating: after } },
          },
        });
      }
    }

    const result =
      writes.length > 0
        ? await comments.bulkWrite(writes, { ordered: false })
        : undefined;

    return {
      fromVotes,
      doubled,
      unchanged,
      modified: result?.modifiedCount ?? 0,
      offBefore,
    };
  },

  // Halving takes a comment back to half a point per vote, votes cast since
  // included, and undoes the doubling of the ones without votes.
  async down({ db }) {
    const result = await db
      .collection<CommentDocument>('comments')
      .updateMany({ rating: { $exists: true, $ne: 0 } }, [
        { $set: { rating: { $multiply: ['$rating', 0.5] } } },
      ]);

    return { halved: result.modifiedCount };
  },
});
