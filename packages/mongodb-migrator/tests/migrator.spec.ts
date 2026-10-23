import { describe, expect, it } from 'vitest';
import {
  createMigrator,
  CriticalMigrationsPendingError,
  irreversible,
  IrreversibleMigrationError,
  MigrationLockedError,
  type Migration,
} from '../src/index';
import { createRecordingLogger, migration, useDatabase } from './helpers';

const newDatabase = useDatabase();

function setup(migrations: Migration[]) {
  const db = newDatabase();
  const { logger, events } = createRecordingLogger();
  const migrator = createMigrator({ db, migrations, logger });
  const records = () =>
    db.collection('migrations').find().sort({ _id: 1 }).toArray();

  return { db, migrator, records, events };
}

describe('stampIfNew', () => {
  it('baselines every migration on a database with nothing in it', async () => {
    const { db, migrator, records, events } = setup([
      migration('20260101-a'),
      migration('20260202-b'),
    ]);

    // Collections Mongoose creates for its indexes exist before any document
    await db.createCollection('users');

    expect(await migrator.stampIfNew()).toBe(true);
    expect(await records()).toEqual([
      { _id: '20260101-a', baselined: true, baselinedAt: expect.any(Date) },
      { _id: '20260202-b', baselined: true, baselinedAt: expect.any(Date) },
    ]);
    expect(
      events.filter(({ event }) => event === 'migration_baselined'),
    ).toEqual([
      {
        level: 'info',
        event: 'migration_baselined',
        metadata: { migration: '20260101-a', reason: 'new_database' },
      },
      {
        level: 'info',
        event: 'migration_baselined',
        metadata: { migration: '20260202-b', reason: 'new_database' },
      },
    ]);
  });

  it('leaves a database that already has data alone', async () => {
    const { db, migrator, records, events } = setup([migration('20260101-a')]);

    await db.collection('users').insertOne({ login: 'someone' });

    expect(await migrator.stampIfNew()).toBe(false);
    expect(await records()).toEqual([]);
    expect(events).toContainEqual({
      level: 'debug',
      event: 'migrations_database_not_new',
      metadata: { hasRecords: false, collectionWithData: 'users' },
    });
  });

  it('leaves a database that already has records alone', async () => {
    const { db, migrator, records } = setup([
      migration('20260101-a'),
      migration('20260202-b'),
    ]);

    await db.collection('migrations').insertOne({
      _id: '20260101-a' as never,
      startedAt: new Date(),
      finishedAt: new Date(),
    });

    expect(await migrator.stampIfNew()).toBe(false);
    expect(await records()).toHaveLength(1);
  });
});

describe('up', () => {
  it('runs the pending migrations in order and records each', async () => {
    const order: string[] = [];
    const { db, migrator, records } = setup([
      migration('20260101-a', {
        up: async () => {
          order.push('a');
        },
      }),
      migration('20260202-b', {
        up: async () => {
          order.push('b');

          return { touched: 3 };
        },
      }),
    ]);

    await db.collection('migrations').insertOne({
      _id: '20260101-a' as never,
      startedAt: new Date(),
      finishedAt: new Date(),
    });

    expect(await migrator.up()).toEqual(['20260202-b']);
    expect(order).toEqual(['b']);
    expect((await records())[1]).toEqual({
      _id: '20260202-b',
      startedAt: expect.any(Date),
      finishedAt: expect.any(Date),
      stats: { touched: 3 },
    });
  });

  it('stops at a failure, records what ran before it, and frees the lock', async () => {
    const { db, migrator, records, events } = setup([
      migration('20260101-a'),
      migration('20260202-b', {
        up: async () => {
          throw new Error('broken');
        },
      }),
      migration('20260303-c'),
    ]);

    await expect(migrator.up()).rejects.toThrow('broken');
    expect((await records()).map(({ _id }) => _id)).toEqual(['20260101-a']);
    expect(await db.collection('migrations_lock').countDocuments()).toBe(0);
    expect(events).toContainEqual({
      level: 'error',
      event: 'migration_failed',
      metadata: {
        migration: '20260202-b',
        direction: 'up',
        durationMs: expect.any(Number),
        error: expect.any(Error),
      },
    });
  });

  it('changes nothing when the confirmation is declined', async () => {
    const { migrator, records } = setup([migration('20260101-a')]);
    const shown: string[][] = [];

    expect(
      await migrator.up({
        confirm: async (ids) => {
          shown.push(ids);

          return false;
        },
      }),
    ).toEqual([]);
    expect(shown).toEqual([['20260101-a']]);
    expect(await records()).toEqual([]);
  });

  it('runs a migration older than the newest record, with a warning', async () => {
    const { db, migrator, events } = setup([
      migration('20260101-late'),
      migration('20260202-b'),
    ]);

    await db.collection('migrations').insertOne({
      _id: '20260202-b' as never,
      startedAt: new Date(),
      finishedAt: new Date(),
    });

    expect(await migrator.up()).toEqual(['20260101-late']);
    expect(events).toContainEqual({
      level: 'warn',
      event: 'migration_out_of_order',
      metadata: { migration: '20260101-late', newestRecorded: '20260202-b' },
    });
  });

  it('gives a migration a logger stamped with its id and direction', async () => {
    const { migrator, events } = setup([
      migration('20260101-a', {
        up: async ({ logger }) => {
          logger.info('things_moved', { count: 2 });
        },
      }),
    ]);

    await migrator.up();

    expect(events).toContainEqual({
      level: 'info',
      event: 'things_moved',
      metadata: { migration: '20260101-a', direction: 'up', count: 2 },
    });
  });

  it('refuses to start while another migrator holds the lock', async () => {
    const { db, migrator, records } = setup([migration('20260101-a')]);

    await db.collection('migrations_lock').insertOne({
      _id: 'migrator' as never,
      owner: 'elsewhere:1',
      acquiredAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(migrator.up()).rejects.toBeInstanceOf(MigrationLockedError);
    expect(await records()).toEqual([]);
  });

  it('takes over a lock whose holder stopped renewing it', async () => {
    const { db, migrator, events } = setup([migration('20260101-a')]);

    await db.collection('migrations_lock').insertOne({
      _id: 'migrator' as never,
      owner: 'elsewhere:1',
      acquiredAt: new Date(Date.now() - 120_000),
      expiresAt: new Date(Date.now() - 60_000),
    });

    expect(await migrator.up()).toEqual(['20260101-a']);
    expect(events.map(({ event }) => event)).toContain(
      'migrator_lock_expired_taken_over',
    );
  });
});

describe('down', () => {
  it('reverts the newest record, baselined or not, and deletes it', async () => {
    const reverted: string[] = [];
    const revert = (id: string) => async () => {
      reverted.push(id);
    };
    const { db, migrator, records } = setup([
      migration('20260101-a', { down: revert('a') }),
      migration('20260202-b', { down: revert('b') }),
    ]);

    await db.collection('migrations').insertMany([
      {
        _id: '20260101-a' as never,
        startedAt: new Date(),
        finishedAt: new Date(),
      },
      { _id: '20260202-b' as never, baselined: true, baselinedAt: new Date() },
    ]);

    expect(await migrator.down()).toBe('20260202-b');
    expect(await migrator.down()).toBe('20260101-a');
    expect(await migrator.down()).toBeUndefined();
    expect(reverted).toEqual(['b', 'a']);
    expect(await records()).toEqual([]);
  });

  it('refuses an irreversible migration and keeps its record', async () => {
    const { migrator, records } = setup([
      migration('20260101-a', { down: irreversible('the data is gone') }),
    ]);

    await migrator.up();

    await expect(migrator.down()).rejects.toBeInstanceOf(
      IrreversibleMigrationError,
    );
    expect(await records()).toHaveLength(1);
  });

  it('refuses a record this build has no file for', async () => {
    const { db, migrator } = setup([migration('20260101-a')]);

    await db.collection('migrations').insertOne({
      _id: '20260909-from-the-future' as never,
      startedAt: new Date(),
      finishedAt: new Date(),
    });

    await expect(migrator.down()).rejects.toThrow('no file for it');
  });
});

describe('baseline', () => {
  it('records the pending migrations up to the one given', async () => {
    const ran: string[] = [];
    const { migrator, records } = setup(
      ['20260101-a', '20260202-b', '20260303-c'].map((id) =>
        migration(id, {
          up: async () => {
            ran.push(id);
          },
        }),
      ),
    );

    expect(await migrator.baseline({ to: '20260202-b' })).toEqual([
      '20260101-a',
      '20260202-b',
    ]);
    expect(ran).toEqual([]);
    expect((await records()).map(({ _id }) => _id)).toEqual([
      '20260101-a',
      '20260202-b',
    ]);
  });

  it('rejects an id there is no migration for', async () => {
    const { migrator } = setup([migration('20260101-a')]);

    await expect(migrator.baseline({ to: '20260101-b' })).rejects.toThrow(
      'There is no migration 20260101-b',
    );
  });
});

describe('status', () => {
  it('tells applied, baselined, pending and unknown apart', async () => {
    const { db, migrator } = setup([
      migration('20260101-a'),
      migration('20260202-b', { down: irreversible('no way back') }),
      migration('20260303-c', { critical: true }),
    ]);

    await db.collection('migrations').insertMany([
      {
        _id: '20260101-a' as never,
        startedAt: new Date(),
        finishedAt: new Date(),
      },
      { _id: '20260202-b' as never, baselined: true, baselinedAt: new Date() },
      {
        _id: '20260404-gone' as never,
        startedAt: new Date(),
        finishedAt: new Date(),
      },
    ]);

    expect(await migrator.status()).toEqual([
      {
        id: '20260101-a',
        state: 'applied',
        at: expect.any(Date),
        reversible: true,
        critical: false,
      },
      {
        id: '20260202-b',
        state: 'baselined',
        at: expect.any(Date),
        reversible: false,
        critical: false,
      },
      {
        id: '20260303-c',
        state: 'pending',
        reversible: true,
        critical: true,
      },
      { id: '20260404-gone', state: 'unknown', at: expect.any(Date) },
    ]);
  });
});

describe('check', () => {
  it('warns about what is still pending without running it', async () => {
    const ran: string[] = [];
    const { db, migrator, events } = setup([
      migration('20260101-a', {
        up: async () => {
          ran.push('a');
        },
      }),
    ]);

    await db.collection('users').insertOne({ login: 'someone' });
    await migrator.check({ hint: 'run it' });

    expect(ran).toEqual([]);
    expect(events).toContainEqual({
      level: 'warn',
      event: 'migrations_pending',
      metadata: { migrations: ['20260101-a'], hint: 'run it' },
    });
  });

  it('refuses when a pending migration is critical', async () => {
    const { db, migrator, events } = setup([
      migration('20260101-a', { critical: true }),
      migration('20260202-b'),
    ]);

    await db.collection('users').insertOne({ login: 'someone' });

    await expect(migrator.check({ hint: 'run it' })).rejects.toThrow(
      CriticalMigrationsPendingError,
    );
    expect(events).toContainEqual({
      level: 'error',
      event: 'migrations_critical_pending',
      metadata: {
        migrations: ['20260101-a'],
        pending: ['20260101-a', '20260202-b'],
        hint: 'run it',
      },
    });
  });

  it('lets a critical migration through once it is recorded', async () => {
    const { db, migrator, events } = setup([
      migration('20260101-a', { critical: true }),
      migration('20260202-b'),
    ]);

    await db.collection('users').insertOne({ login: 'someone' });
    await migrator.baseline({ to: '20260101-a' });

    await expect(migrator.check()).resolves.toBeUndefined();
    expect(events).toContainEqual(
      expect.objectContaining({
        event: 'migrations_pending',
        metadata: { migrations: ['20260202-b'], hint: undefined },
      }),
    );
  });
});
