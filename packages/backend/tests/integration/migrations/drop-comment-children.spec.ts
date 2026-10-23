import mongoose, { Types } from 'mongoose';
import { logger } from '@libs/logger';
import migration from '../../../migrations/20261021-drop-comment-children';

describe('20261021-drop-comment-children', () => {
  const comments = () => mongoose.connection.db!.collection('comments');

  afterAll(async () => {
    if (await comments().indexExists('post_1')) {
      await comments().dropIndex('post_1');
    }
  });

  it('drops children and the post index, and rebuilds both on the way down', async () => {
    const context = { db: mongoose.connection.db!, logger };
    const post = new Types.ObjectId();
    const parent = new Types.ObjectId();
    const [first, second] = [new Types.ObjectId(), new Types.ObjectId()];
    const deletedSince = new Types.ObjectId();

    await comments().createIndex({ post: 1 });
    await comments().insertMany([
      { _id: parent, post, children: [first, second, deletedSince] },
      { _id: first, post, parent, children: [] },
      { _id: second, post, parent, children: [] },
    ]);

    expect(await migration.up(context)).toEqual({
      unsetChildren: 3,
      droppedPostIndex: true,
    });
    expect(
      await comments().countDocuments({ children: { $exists: true } }),
    ).toBe(0);
    expect(await comments().indexExists('post_1')).toBe(false);
    expect(await comments().indexExists('post_1_parent_1_rating_-1')).toBe(
      true,
    );

    await migration.down(context);

    expect(
      await comments()
        .find({}, { projection: { children: 1 } })
        .sort({ _id: 1 })
        .toArray(),
    ).toEqual([
      { _id: parent, children: [first, second] },
      { _id: first, children: [] },
      { _id: second, children: [] },
    ]);
    expect(await comments().indexExists('post_1')).toBe(true);
  });
});
