import type { Db } from 'mongodb';
import { CriticalMigrationsPendingError } from './errors/CriticalMigrationsPendingError';
import { IrreversibleMigrationError } from './errors/IrreversibleMigrationError';
import { acquireLock } from './lock';
import {
  isBaselined,
  isIrreversible,
  type Direction,
  type LogMetadata,
  type Migration,
  type MigrationRecord,
  type MigrationStatus,
  type MigratorLogger,
} from './types';

export interface MigratorOptions {
  db: Db;
  /** As `loadMigrations` returns them: sorted, oldest first */
  migrations: Migration[];
  logger: MigratorLogger;
  collectionName?: string;
  lockCollectionName?: string;
  lockTtlMs?: number;
}

/** Shown the ids a command is about to act on; nothing changes unless it
 * resolves to true */
export type Confirm = (ids: string[]) => Promise<boolean>;

function recordedAt(record: MigrationRecord) {
  return isBaselined(record) ? record.baselinedAt : record.finishedAt;
}

/** Migrations build on each other, so nothing here may run in parallel */
async function inSeries<T>(items: T[], task: (item: T) => Promise<void>) {
  for (const item of items) {
    // eslint-disable-next-line no-await-in-loop
    await task(item);
  }
}

function scopeLogger(
  logger: MigratorLogger,
  scope: LogMetadata,
): MigratorLogger {
  const withScope = (metadata?: LogMetadata) => ({ ...scope, ...metadata });

  return {
    debug: (event, metadata) => logger.debug(event, withScope(metadata)),
    info: (event, metadata) => logger.info(event, withScope(metadata)),
    warn: (event, metadata) => logger.warn(event, withScope(metadata)),
    error: (event, metadata) => logger.error(event, withScope(metadata)),
  };
}

export function createMigrator({
  db,
  migrations,
  logger,
  collectionName = 'migrations',
  lockCollectionName = 'migrations_lock',
  lockTtlMs = 60_000,
}: MigratorOptions) {
  const records = db.collection<MigrationRecord>(collectionName);
  const byId = new Map(
    migrations.map((migration) => [migration.id, migration]),
  );

  const readRecords = () => records.find().sort({ _id: 1 }).toArray();

  async function withLock<T>(task: () => Promise<T>): Promise<T> {
    const lock = await acquireLock(db, {
      collectionName: lockCollectionName,
      ttlMs: lockTtlMs,
      logger,
    });

    try {
      return await task();
    } finally {
      await lock.release();
    }
  }

  function warnAboutUnknown(recorded: MigrationRecord[]) {
    const unknown = recorded
      .map((record) => record._id)
      .filter((id) => !byId.has(id));

    if (unknown.length > 0) {
      logger.warn('migrations_unknown', {
        migrations: unknown,
        hint: 'recorded in the database, but this build has no file for them',
      });
    }
  }

  async function run(migration: Migration, direction: Direction) {
    const task = direction === 'up' ? migration.up : migration.down;

    if (isIrreversible(task)) {
      throw new IrreversibleMigrationError(migration.id, task.reason);
    }

    const startedAt = new Date();

    logger.info('migration_started', { migration: migration.id, direction });

    try {
      const stats = await task({
        db,
        logger: scopeLogger(logger, { migration: migration.id, direction }),
      });
      const finishedAt = new Date();

      logger.info('migration_finished', {
        migration: migration.id,
        direction,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        stats,
      });

      return { startedAt, finishedAt, stats };
    } catch (error) {
      logger.error('migration_failed', {
        migration: migration.id,
        direction,
        durationMs: Date.now() - startedAt.getTime(),
        error,
      });

      throw error;
    }
  }

  async function recordBaselined(ids: string[], reason: string) {
    await inSeries(ids, async (id) => {
      await records.insertOne({
        _id: id,
        baselined: true,
        baselinedAt: new Date(),
      });
      logger.info('migration_baselined', { migration: id, reason });
    });

    logger.info('migrations_baselined', { count: ids.length, reason });
  }

  /** The first collection with a document in it, ignoring the migrator's own */
  async function findCollectionWithData() {
    const names = (
      await db
        .listCollections({ type: 'collection' }, { nameOnly: true })
        .toArray()
    )
      .map(({ name }) => name)
      .filter(
        (name) =>
          !name.startsWith('system.') &&
          name !== collectionName &&
          name !== lockCollectionName,
      );

    for (const name of names) {
      // eslint-disable-next-line no-await-in-loop
      if (await db.collection(name).findOne({}, { projection: { _id: 1 } })) {
        return name;
      }
    }

    return undefined;
  }

  async function status(): Promise<MigrationStatus[]> {
    const recorded = new Map(
      (await readRecords()).map((record) => [record._id, record]),
    );
    const ids = [...new Set([...byId.keys(), ...recorded.keys()])].sort();

    return ids.map((id) => {
      const record = recorded.get(id);
      const migration = byId.get(id);

      if (!migration) {
        return {
          id,
          state: 'unknown',
          at: record ? recordedAt(record) : undefined,
        };
      }

      const known = {
        reversible: !isIrreversible(migration.down),
        critical: migration.critical,
      };

      if (!record) {
        return { id, state: 'pending', ...known };
      }

      return {
        id,
        state: isBaselined(record) ? 'baselined' : 'applied',
        at: recordedAt(record),
        ...known,
      };
    });
  }

  /** Applies every migration without a record, oldest first */
  function up({ confirm }: { confirm?: Confirm } = {}) {
    return withLock(async () => {
      const recorded = await readRecords();
      const recordedIds = new Set(recorded.map((record) => record._id));
      const pending = migrations.filter(({ id }) => !recordedIds.has(id));
      const newestRecorded = recorded.at(-1)?._id;

      warnAboutUnknown(recorded);

      if (pending.length === 0) {
        logger.info('migrations_up_to_date', { recorded: recorded.length });

        return [];
      }

      const ids = pending.map(({ id }) => id);

      logger.info('migrations_pending', { migrations: ids });

      if (confirm && !(await confirm(ids))) {
        logger.info('migrations_cancelled', { direction: 'up' });

        return [];
      }

      await inSeries(pending, async (migration) => {
        if (newestRecorded && migration.id < newestRecorded) {
          // Normal for a branch merged after a newer migration had already run
          logger.warn('migration_out_of_order', {
            migration: migration.id,
            newestRecorded,
          });
        }

        const { startedAt, finishedAt, stats } = await run(migration, 'up');

        await records.insertOne({
          _id: migration.id,
          startedAt,
          finishedAt,
          ...(stats === undefined ? {} : { stats }),
        });
      });

      logger.info('migrations_applied', { migrations: ids });

      return ids;
    });
  }

  /** Reverts the newest recorded migration, baselined ones included: the data
   * is in their shape either way */
  function down({ confirm }: { confirm?: Confirm } = {}) {
    return withLock(async () => {
      const newest = (await readRecords()).at(-1);

      if (!newest) {
        logger.info('migrations_nothing_to_revert');

        return undefined;
      }

      const migration = byId.get(newest._id);

      if (!migration) {
        throw new Error(
          `${newest._id} is the newest recorded migration, but this build has no file for it. Revert it from a build that has.`,
        );
      }

      if (isIrreversible(migration.down)) {
        logger.error('migration_irreversible', {
          migration: migration.id,
          reason: migration.down.reason,
        });

        throw new IrreversibleMigrationError(
          migration.id,
          migration.down.reason,
        );
      }

      if (confirm && !(await confirm([migration.id]))) {
        logger.info('migrations_cancelled', { direction: 'down' });

        return undefined;
      }

      await run(migration, 'down');
      await records.deleteOne({ _id: migration.id });

      logger.info('migration_reverted', {
        migration: migration.id,
        wasBaselined: isBaselined(newest),
      });

      return migration.id;
    });
  }

  /** Records pending migrations as applied without running them, every one of
   * them or those up to and including `to` */
  function baseline({ to, confirm }: { to?: string; confirm?: Confirm } = {}) {
    if (to !== undefined && !byId.has(to)) {
      return Promise.reject(new Error(`There is no migration ${to}`));
    }

    return withLock(async () => {
      const recordedIds = new Set(
        (await readRecords()).map((record) => record._id),
      );
      const ids = migrations
        .map(({ id }) => id)
        .filter((id) => !recordedIds.has(id) && (to === undefined || id <= to));

      if (ids.length === 0) {
        logger.info('migrations_nothing_to_baseline', { to });

        return [];
      }

      if (confirm && !(await confirm(ids))) {
        logger.info('migrations_cancelled', { direction: 'baseline' });

        return [];
      }

      await recordBaselined(ids, 'manual');

      return ids;
    });
  }

  /**
   * Baselines every migration when the database has nothing in it yet.
   *
   * A new database is filled by the current code, so it is born in the shape
   * of every migration there is. Left unrecorded, the first `up` after a later
   * pull would run all of them against data that never needed them.
   */
  function stampIfNew() {
    return withLock(async () => {
      const recordCount = await records.countDocuments({}, { limit: 1 });
      const collectionWithData =
        recordCount > 0 ? undefined : await findCollectionWithData();

      if (recordCount > 0 || collectionWithData) {
        logger.debug('migrations_database_not_new', {
          hasRecords: recordCount > 0,
          collectionWithData,
        });

        return false;
      }

      await recordBaselined(
        migrations.map(({ id }) => id),
        'new_database',
      );

      return true;
    });
  }

  /**
   * What a service runs at boot, before it serves anything: stamps a new
   * database, otherwise warns about anything that still has to be run by hand.
   * Never runs a migration.
   *
   * Throws `CriticalMigrationsPendingError` when a pending migration is
   * critical, for the service to refuse to start.
   */
  async function check({ hint }: { hint?: string } = {}) {
    if (await stampIfNew()) {
      return;
    }

    const statuses = await status();
    const pending = statuses.filter(({ state }) => state === 'pending');
    const unknown = statuses.filter(({ state }) => state === 'unknown');

    if (unknown.length > 0) {
      logger.warn('migrations_unknown', {
        migrations: unknown.map(({ id }) => id),
        hint: 'recorded in the database, but this build has no file for them',
      });
    }

    const critical = pending
      .filter((migration) => migration.critical)
      .map(({ id }) => id);

    if (critical.length > 0) {
      logger.error('migrations_critical_pending', {
        migrations: critical,
        pending: pending.map(({ id }) => id),
        hint,
      });

      throw new CriticalMigrationsPendingError(critical);
    }

    if (pending.length > 0) {
      logger.warn('migrations_pending', {
        migrations: pending.map(({ id }) => id),
        hint,
      });

      return;
    }

    logger.info('migrations_up_to_date', { recorded: statuses.length });
  }

  return { status, up, down, baseline, stampIfNew, check };
}

export type Migrator = ReturnType<typeof createMigrator>;
