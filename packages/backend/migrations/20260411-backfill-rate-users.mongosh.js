/*
 * Backfill rates.user from the legacy users.rates array.
 *
 * Take a backup before running this migration:
 *
 *   bash packages/backend/scripts/backup-mongo-before-rates-migration.sh
 *
 * Run with mongosh against the target database, for example:
 *
 *   mongosh "$DB_URL" packages/backend/migrations/20260411-backfill-rate-users.mongosh.js
 *
 * Docker Compose example from the host when MongoDB is not exposed as a host
 * port:
 *
 *   docker compose exec -T smiler-db mongosh \
 *     "mongodb://$MONGO_INITDB_ROOT_USERNAME:$MONGO_INITDB_ROOT_PASSWORD@localhost:${DB_PORT:-27017}/$MONGO_INITDB_DATABASE?authSource=admin" \
 *     --file /dev/stdin \
 *     < packages/backend/migrations/20260411-backfill-rate-users.mongosh.js
 */

const migrationId = '20260411-backfill-rate-users';
const migrations = db.getCollection('migrations');
const users = db.getCollection('users');
const rates = db.getCollection('rates');

if (migrations.findOne({ _id: migrationId })) {
  print(`[${migrationId}] already applied`);
  quit(0);
}

const startedAt = new Date();
let usersVisited = 0;
let ratesBackfilled = 0;
let ratesAlreadyLinked = 0;
let ratesCloned = 0;
let missingRateRefs = 0;
let totalLegacyRateRefs = 0;
let matchedLegacyRateRefs = 0;
let duplicateUserTargetsSkipped = 0;
let conflictingDuplicateTargets = 0;
let invalidRateDocs = 0;
const missingRateRefSamples = [];

function objectIdKey(id) {
  if (!id) {
    return '';
  }

  if (typeof id.toHexString === 'function') {
    return id.toHexString();
  }

  return String(id);
}

function idsEqual(left, right) {
  return objectIdKey(left) === objectIdKey(right);
}

function targetKey(rate) {
  return `${rate.targetModel}:${objectIdKey(rate.target)}`;
}

const legacyUsers = users.find(
  {
    rates: {
      $exists: true,
      $type: 'array',
      $ne: [],
    },
  },
  {
    _id: 1,
    rates: 1,
  },
);

const usersWithRatesField = users.countDocuments({
  rates: {
    $exists: true,
  },
});
const usersWithLegacyRates = users.countDocuments({
  rates: {
    $exists: true,
    $type: 'array',
    $ne: [],
  },
});
const ratesWithoutUser = rates.countDocuments({
  user: {
    $exists: false,
  },
});

if (usersWithRatesField > 0 && usersWithLegacyRates === 0) {
  throw new Error(
    [
      'Aborting migration because users.rates exists, but no user has a',
      'non-empty legacy rates array. There is no user-to-rate mapping to',
      'backfill rates.user from. Restore a backup that still has non-empty',
      'users.rates arrays, or investigate why those arrays are empty before',
      'running this migration.',
      `usersWithRatesField=${usersWithRatesField}`,
      `ratesWithoutUser=${ratesWithoutUser}`,
    ].join(' '),
  );
}

legacyUsers.forEach((user) => {
  if (!Array.isArray(user.rates) || user.rates.length === 0) {
    return;
  }

  usersVisited += 1;
  totalLegacyRateRefs += user.rates.length;

  const seenTargets = new Set();
  const uniqueRateIdsByKey = new Map(
    user.rates.map((rateId) => [objectIdKey(rateId), rateId]),
  );
  const uniqueRateIds = [...uniqueRateIdsByKey.values()];
  const rateDocs = rates
    .find(
      { _id: { $in: uniqueRateIds } },
      {
        _id: 1,
        user: 1,
        target: 1,
        targetModel: 1,
        negative: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    )
    .toArray();
  matchedLegacyRateRefs += rateDocs.length;

  const ratesById = new Map(
    rateDocs.map((rate) => [objectIdKey(rate._id), rate]),
  );

  user.rates.forEach((rateId) => {
    const rate = ratesById.get(objectIdKey(rateId));

    if (!rate) {
      missingRateRefs += 1;

      if (missingRateRefSamples.length < 10) {
        missingRateRefSamples.push({
          user: user._id,
          missingRate: rateId,
        });
      }

      return;
    }

    if (!rate.target || !rate.targetModel) {
      invalidRateDocs += 1;
      return;
    }

    const key = targetKey(rate);

    if (seenTargets.has(key)) {
      duplicateUserTargetsSkipped += 1;
      return;
    }

    seenTargets.add(key);

    const existingForUserAndTarget = rates.findOne({
      user: user._id,
      target: rate.target,
      targetModel: rate.targetModel,
    });

    if (existingForUserAndTarget) {
      ratesAlreadyLinked += 1;

      if (existingForUserAndTarget.negative !== rate.negative) {
        conflictingDuplicateTargets += 1;
      }

      return;
    }

    if (!rate.user) {
      const updated = rates.updateOne(
        {
          _id: rate._id,
          user: { $exists: false },
        },
        {
          $set: {
            user: user._id,
            updatedAt: rate.updatedAt || new Date(),
          },
        },
      );

      if (updated.matchedCount === 1) {
        ratesBackfilled += 1;
        return;
      }
    }

    if (idsEqual(rate.user, user._id)) {
      ratesAlreadyLinked += 1;
      return;
    }

    rates.insertOne({
      user: user._id,
      target: rate.target,
      targetModel: rate.targetModel,
      negative: Boolean(rate.negative),
      createdAt: rate.createdAt || new Date(),
      updatedAt: rate.updatedAt || new Date(),
    });
    ratesCloned += 1;
  });
});

if (usersWithLegacyRates > 0 && usersVisited !== usersWithLegacyRates) {
  throw new Error(
    [
      'Aborting migration before removing users.rates because the migration',
      'did not process every user with a non-empty legacy rates array.',
      `usersWithLegacyRates=${usersWithLegacyRates}`,
      `usersVisited=${usersVisited}`,
    ].join(' '),
  );
}

if (
  usersWithLegacyRates > 0 &&
  ratesBackfilled + ratesAlreadyLinked + ratesCloned === 0
) {
  print(
    [
      'Warning: legacy users were found, but no usable rate links were',
      'migrated. The migration will still remove users.rates because missing',
      'rate references are treated as dead legacy data.',
      `usersWithLegacyRates=${usersWithLegacyRates}`,
      `usersVisited=${usersVisited}`,
      `totalLegacyRateRefs=${totalLegacyRateRefs}`,
      `matchedLegacyRateRefs=${matchedLegacyRateRefs}`,
      `missingRateRefs=${missingRateRefs}`,
      `invalidRateDocs=${invalidRateDocs}`,
      `missingRateRefSamples=${JSON.stringify(missingRateRefSamples)}`,
    ].join(' '),
  );
}

const duplicateGroups = rates
  .aggregate([
    {
      $match: {
        user: { $exists: true },
        target: { $exists: true },
        targetModel: { $exists: true },
      },
    },
    {
      $sort: {
        updatedAt: -1,
        createdAt: -1,
        _id: -1,
      },
    },
    {
      $group: {
        _id: {
          user: '$user',
          target: '$target',
          targetModel: '$targetModel',
        },
        ids: { $push: '$_id' },
        count: { $sum: 1 },
      },
    },
    {
      $match: {
        count: { $gt: 1 },
      },
    },
  ])
  .toArray();

let duplicateRatesRemoved = 0;

duplicateGroups.forEach((group) => {
  const duplicateIds = group.ids.slice(1);

  if (duplicateIds.length === 0) {
    return;
  }

  const result = rates.deleteMany({ _id: { $in: duplicateIds } });
  duplicateRatesRemoved += result.deletedCount;
});

rates.createIndex({ target: 1 });
rates.createIndex(
  {
    user: 1,
    target: 1,
    targetModel: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      user: { $exists: true },
    },
  },
);

const usersUpdated = users.updateMany(
  {
    rates: {
      $exists: true,
    },
  },
  { $unset: { rates: '' } },
);

migrations.insertOne({
  _id: migrationId,
  startedAt,
  finishedAt: new Date(),
  stats: {
    usersVisited,
    ratesBackfilled,
    ratesAlreadyLinked,
    ratesCloned,
    totalLegacyRateRefs,
    matchedLegacyRateRefs,
    missingRateRefs,
    missingRateRefSamples,
    duplicateUserTargetsSkipped,
    conflictingDuplicateTargets,
    invalidRateDocs,
    duplicateRatesRemoved,
    usersUnsetRates: usersUpdated.modifiedCount,
  },
});

printjson({
  migrationId,
  usersVisited,
  ratesBackfilled,
  ratesAlreadyLinked,
  ratesCloned,
  totalLegacyRateRefs,
  matchedLegacyRateRefs,
  missingRateRefs,
  missingRateRefSamples,
  duplicateUserTargetsSkipped,
  conflictingDuplicateTargets,
  invalidRateDocs,
  duplicateRatesRemoved,
  usersUnsetRates: usersUpdated.modifiedCount,
});
