/*
 * Drop comments.children and the comments index on { post: 1 }.
 *
 * Replies are found through `parent` since the comment tree is read with one
 * $graphLookup, and nothing reads or writes `children` any more. Old documents
 * still carry the array, some of it ids of replies deleted since.
 *
 * { post: 1, parent: 1, rating: -1 } replaced { post: 1 }, but Mongoose only
 * creates the indexes a model declares and never drops one it stopped
 * declaring. The compound index serves every query the old one did, so this
 * refuses to drop the old one until the app has created the new one.
 *
 * There is no way back to a release that reads `children` after this: run it
 * once the release without `children` is deployed and staying.
 *
 * Take a backup before running this migration:
 *
 *   mongodump --uri "$DB_URL" --collection comments --out ./backup-comments
 *
 * Run with mongosh against the target database, after the deploy:
 *
 *   mongosh "$DB_URL" packages/backend/migrations/20261021-drop-comment-children.mongosh.js
 *
 * Docker Compose example from the host when MongoDB is not exposed as a host
 * port:
 *
 *   docker compose exec -T smiler-db mongosh \
 *     "mongodb://$MONGO_INITDB_ROOT_USERNAME:$MONGO_INITDB_ROOT_PASSWORD@localhost:${DB_PORT:-27017}/$MONGO_INITDB_DATABASE?authSource=admin" \
 *     --file /dev/stdin \
 *     < packages/backend/migrations/20261021-drop-comment-children.mongosh.js
 */

const migrationId = '20261021-drop-comment-children';
const migrations = db.getCollection('migrations');
const comments = db.getCollection('comments');

if (migrations.findOne({ _id: migrationId })) {
  print(`[${migrationId}] already applied`);
  quit(0);
}

const indexNames = comments.getIndexes().map((index) => index.name);

if (!indexNames.includes('post_1_parent_1_rating_-1')) {
  print(
    `[${migrationId}] the index on { post: 1, parent: 1, rating: -1 } does not exist yet: start the new release once so that Mongoose creates it, then run this again`,
  );
  quit(1);
}

const startedAt = new Date();

const unset = comments.updateMany(
  { children: { $exists: true } },
  { $unset: { children: '' } },
);

const droppedPostIndex = indexNames.includes('post_1');

if (droppedPostIndex) {
  comments.dropIndex('post_1');
}

const stats = {
  unsetChildren: unset.modifiedCount,
  droppedPostIndex,
};

migrations.insertOne({
  _id: migrationId,
  startedAt,
  finishedAt: new Date(),
  stats,
});

printjson({ migrationId, ...stats });
