/*
 * Backfill rates.user from the legacy users.rates array.
 *
 * Touches: users, rates.
 *
 * Duplicate votes of one user on one target are deleted along the way, keeping
 * the newest, and users.rates is dropped once every link is in rates.
 */
// One user at a time, so memory stays flat however many users there are
/* eslint-disable no-await-in-loop, no-continue */
import { irreversible, defineMigration } from '@smiler/mongodb-migrator';
import type { Filter, ObjectId } from 'mongodb';

interface LegacyUser {
  _id: ObjectId;
  rates?: ObjectId[];
}

interface RateDocument {
  user?: ObjectId;
  target?: ObjectId;
  targetModel?: string;
  negative?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const nonEmptyRates: Filter<LegacyUser> = {
  rates: { $exists: true, $type: 'array', $ne: [] },
};

const objectIdKey = (id: ObjectId | undefined) => id?.toHexString() ?? '';

const targetKey = (rate: RateDocument) =>
  `${rate.targetModel}:${objectIdKey(rate.target)}`;

export default defineMigration({
  // Votes are found by rates.user: until it is filled in, an old vote is
  // invisible to its author, who can then cast it a second time
  critical: true,

  async up({ db, logger }) {
    const users = db.collection<LegacyUser>('users');
    const rates = db.collection<RateDocument>('rates');

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
    const missingRateRefSamples: { user: ObjectId; missingRate: ObjectId }[] =
      [];

    const usersWithRatesField = await users.countDocuments({
      rates: { $exists: true },
    });
    const usersWithLegacyRates = await users.countDocuments(nonEmptyRates);
    const ratesWithoutUser = await rates.countDocuments({
      user: { $exists: false },
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

    const legacyUsers = users.find(nonEmptyRates, {
      projection: { _id: 1, rates: 1 },
    });

    for await (const user of legacyUsers) {
      if (!Array.isArray(user.rates) || user.rates.length === 0) {
        continue;
      }

      usersVisited += 1;
      totalLegacyRateRefs += user.rates.length;

      const seenTargets = new Set<string>();
      const uniqueRateIds = [
        ...new Map(
          user.rates.map((rateId) => [objectIdKey(rateId), rateId]),
        ).values(),
      ];
      const rateDocs = await rates
        .find(
          { _id: { $in: uniqueRateIds } },
          {
            projection: {
              _id: 1,
              user: 1,
              target: 1,
              targetModel: 1,
              negative: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        )
        .toArray();

      matchedLegacyRateRefs += rateDocs.length;

      const ratesById = new Map(
        rateDocs.map((rate) => [objectIdKey(rate._id), rate]),
      );

      for (const rateId of user.rates) {
        const rate = ratesById.get(objectIdKey(rateId));

        if (!rate) {
          missingRateRefs += 1;

          if (missingRateRefSamples.length < 10) {
            missingRateRefSamples.push({ user: user._id, missingRate: rateId });
          }

          continue;
        }

        if (!rate.target || !rate.targetModel) {
          invalidRateDocs += 1;
          continue;
        }

        const key = targetKey(rate);

        if (seenTargets.has(key)) {
          duplicateUserTargetsSkipped += 1;
          continue;
        }

        seenTargets.add(key);

        const existingForUserAndTarget = await rates.findOne({
          user: user._id,
          target: rate.target,
          targetModel: rate.targetModel,
        });

        if (existingForUserAndTarget) {
          ratesAlreadyLinked += 1;

          if (existingForUserAndTarget.negative !== rate.negative) {
            conflictingDuplicateTargets += 1;
          }

          continue;
        }

        if (!rate.user) {
          const updated = await rates.updateOne(
            { _id: rate._id, user: { $exists: false } },
            {
              $set: {
                user: user._id,
                updatedAt: rate.updatedAt || new Date(),
              },
            },
          );

          if (updated.matchedCount === 1) {
            ratesBackfilled += 1;
            continue;
          }
        }

        if (objectIdKey(rate.user) === objectIdKey(user._id)) {
          ratesAlreadyLinked += 1;
          continue;
        }

        await rates.insertOne({
          user: user._id,
          target: rate.target,
          targetModel: rate.targetModel,
          negative: Boolean(rate.negative),
          createdAt: rate.createdAt || new Date(),
          updatedAt: rate.updatedAt || new Date(),
        });
        ratesCloned += 1;
      }
    }

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
      // Missing rate references are dead legacy data: users.rates still goes
      logger.warn('legacy_rates_unusable', {
        usersWithLegacyRates,
        usersVisited,
        totalLegacyRateRefs,
        matchedLegacyRateRefs,
        missingRateRefs,
        invalidRateDocs,
        missingRateRefSamples,
      });
    }

    const duplicateGroups = await rates
      .aggregate<{ ids: ObjectId[] }>([
        {
          $match: {
            user: { $exists: true },
            target: { $exists: true },
            targetModel: { $exists: true },
          },
        },
        { $sort: { updatedAt: -1, createdAt: -1, _id: -1 } },
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
        { $match: { count: { $gt: 1 } } },
      ])
      .toArray();

    const duplicateIds = duplicateGroups.flatMap(({ ids }) => ids.slice(1));
    const duplicateRatesRemoved =
      duplicateIds.length > 0
        ? (await rates.deleteMany({ _id: { $in: duplicateIds } })).deletedCount
        : 0;

    await rates.createIndex({ target: 1 });
    await rates.createIndex(
      { user: 1, target: 1, targetModel: 1 },
      { unique: true, partialFilterExpression: { user: { $exists: true } } },
    );

    const usersUpdated = await users.updateMany(
      { rates: { $exists: true } },
      { $unset: { rates: '' } },
    );

    return {
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
    };
  },

  down: irreversible(
    'the duplicate votes it deleted cannot be restored, and no release reads users.rates any more',
  ),
});
