/*
 * Rescale comments.rating from half a point per vote to one point per vote.
 *
 * A vote used to move both the comment and its author by 0.5. Now it moves
 * the comment by 1 and its author by 0.5, so authors' ratings stay as they
 * are and only the comments change.
 *
 * Every vote has a document in `rates`, so a comment's rating becomes its
 * upvotes minus its downvotes. Votes cast between the deploy and this run are
 * counted like any other, so it can run at any time after the deploy. A
 * comment with no rates has no votes on record: its rating is doubled, which
 * leaves a 0 at 0 and gives the comments from before the field existed a 0.
 *
 * Take a backup before running this migration:
 *
 *   mongodump --uri "$DB_URL" --collection comments --out ./backup-comments
 *
 * Run with mongosh against the target database, after the deploy:
 *
 *   mongosh "$DB_URL" packages/backend/migrations/20261021-comment-rating-from-votes.mongosh.js
 *
 * Docker Compose example from the host when MongoDB is not exposed as a host
 * port:
 *
 *   docker compose exec -T smiler-db mongosh \
 *     "mongodb://$MONGO_INITDB_ROOT_USERNAME:$MONGO_INITDB_ROOT_PASSWORD@localhost:${DB_PORT:-27017}/$MONGO_INITDB_DATABASE?authSource=admin" \
 *     --file /dev/stdin \
 *     < packages/backend/migrations/20261021-comment-rating-from-votes.mongosh.js
 */

const migrationId = '20261021-comment-rating-from-votes';
const migrations = db.getCollection('migrations');
const comments = db.getCollection('comments');
const rates = db.getCollection('rates');

if (migrations.findOne({ _id: migrationId })) {
  print(`[${migrationId}] already applied`);
  quit(0);
}

const startedAt = new Date();

const netVotes = new Map(
  rates
    .aggregate([
      { $match: { targetModel: 'Comment' } },
      {
        $group: {
          _id: '$target',
          net: { $sum: { $cond: ['$negative', -1, 1] } },
        },
      },
    ])
    .toArray()
    .map((group) => [group._id.toHexString(), group.net]),
);

let fromVotes = 0;
let doubled = 0;
let unchanged = 0;
// Not 0.5 × their votes before the change: votes cast after the deploy, or a
// stored rating that had drifted. Either way the votes win.
const offBefore = [];
const writes = [];

comments.find({}, { _id: 1, rating: 1 }).forEach((comment) => {
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
    return;
  }

  writes.push({
    updateOne: {
      filter: { _id: comment._id },
      update: { $set: { rating: after } },
    },
  });
});

const result =
  writes.length > 0 ? comments.bulkWrite(writes, { ordered: false }) : null;

const stats = {
  fromVotes,
  doubled,
  unchanged,
  modified: result ? result.modifiedCount : 0,
  offBefore,
};

migrations.insertOne({
  _id: migrationId,
  startedAt,
  finishedAt: new Date(),
  stats,
});

printjson({ migrationId, ...stats });
