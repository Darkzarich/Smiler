import mongoose, { Types } from 'mongoose';
import { logger } from '@libs/logger';
import migration from '../../../migrations/20260411-backfill-rate-users';

describe('20260411-backfill-rate-users', () => {
  it('links every legacy rate to its user and drops users.rates', async () => {
    const db = mongoose.connection.db!;
    const [voter, otherVoter, laterOwner] = [
      new Types.ObjectId(),
      new Types.ObjectId(),
      new Types.ObjectId(),
    ];
    const unlinked = new Types.ObjectId();
    const ownedByAnother = new Types.ObjectId();
    const target = new Types.ObjectId();

    await db.collection('rates').insertMany([
      { _id: unlinked, target, targetModel: 'Post', negative: false },
      {
        _id: ownedByAnother,
        user: laterOwner,
        target,
        targetModel: 'Comment',
        negative: true,
      },
    ]);
    await db.collection('users').insertMany([
      {
        _id: voter,
        login: 'voter',
        email: 'voter@example.com',
        rates: [unlinked, new Types.ObjectId()],
      },
      {
        _id: otherVoter,
        login: 'other-voter',
        email: 'other-voter@example.com',
        rates: [ownedByAnother],
      },
    ]);

    expect(await migration.up({ db, logger })).toMatchObject({
      usersVisited: 2,
      ratesBackfilled: 1,
      ratesCloned: 1,
      missingRateRefs: 1,
      usersUnsetRates: 2,
    });
    expect(
      await db
        .collection('rates')
        .find({ target }, { projection: { _id: 0, user: 1, targetModel: 1 } })
        .sort({ targetModel: 1, user: 1 })
        .toArray(),
    ).toEqual([
      { user: otherVoter, targetModel: 'Comment' },
      { user: laterOwner, targetModel: 'Comment' },
      { user: voter, targetModel: 'Post' },
    ]);
    expect(
      await db.collection('users').countDocuments({ rates: { $exists: true } }),
    ).toBe(0);
    expect(migration.down).toEqual({
      kind: 'irreversible',
      reason: expect.any(String),
    });
  });
});
