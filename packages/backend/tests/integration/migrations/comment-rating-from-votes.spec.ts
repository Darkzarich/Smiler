import mongoose, { Types } from 'mongoose';
import { logger } from '@libs/logger';
import migration from '../../../migrations/20261021-comment-rating-from-votes';

const votes = (target: Types.ObjectId, ...negatives: boolean[]) =>
  negatives.map((negative) => ({
    user: new Types.ObjectId(),
    target,
    targetModel: 'Comment',
    negative,
  }));

describe('20261021-comment-rating-from-votes', () => {
  const upvoted = new Types.ObjectId();
  const mixed = new Types.ObjectId();
  const withoutVotes = new Types.ObjectId();
  const withoutRating = new Types.ObjectId();

  const ratings = async () => {
    const comments = await mongoose.connection
      .db!.collection('comments')
      .find()
      .toArray();

    return Object.fromEntries(
      comments.map(({ _id: id, rating }) => [id.toHexString(), rating]),
    );
  };

  beforeEach(async () => {
    const { db } = mongoose.connection;

    await db!
      .collection('comments')
      .insertMany([
        { _id: upvoted, rating: 1.5 },
        { _id: mixed, rating: 0.5 },
        { _id: withoutVotes, rating: 2 },
        { _id: withoutRating },
      ]);
    await db!
      .collection('rates')
      .insertMany([
        ...votes(upvoted, false, false, false),
        ...votes(mixed, false, false, true),
      ]);
  });

  it('counts a vote as a whole point on the comment, and back as half', async () => {
    const context = { db: mongoose.connection.db!, logger };

    expect(await migration.up(context)).toEqual({
      fromVotes: 2,
      doubled: 2,
      unchanged: 0,
      modified: 4,
      offBefore: [],
    });
    expect(await ratings()).toEqual({
      [upvoted.toHexString()]: 3,
      [mixed.toHexString()]: 1,
      [withoutVotes.toHexString()]: 4,
      [withoutRating.toHexString()]: 0,
    });

    await migration.down(context);

    expect(await ratings()).toEqual({
      [upvoted.toHexString()]: 1.5,
      [mixed.toHexString()]: 0.5,
      [withoutVotes.toHexString()]: 2,
      [withoutRating.toHexString()]: 0,
    });
  });
});
