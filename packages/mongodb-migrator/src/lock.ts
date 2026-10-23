import { hostname } from 'node:os';
import { MongoServerError, type Db } from 'mongodb';
import { MigrationLockedError } from './errors/MigrationLockedError';
import type { MigratorLogger } from './types';

const LOCK_ID = 'migrator';
const DUPLICATE_KEY = 11000;

interface LockDocument {
  _id: string;
  owner: string;
  acquiredAt: Date;
  expiresAt: Date;
}

export interface Lock {
  release(): Promise<void>;
}

/**
 * One migrator at a time per database. The lock carries an expiry that the
 * holder keeps pushing forward, so a process killed mid-run blocks the next
 * one for one `ttlMs` at most instead of forever.
 */
export async function acquireLock(
  db: Db,
  {
    collectionName,
    ttlMs,
    logger,
  }: { collectionName: string; ttlMs: number; logger: MigratorLogger },
): Promise<Lock> {
  const locks = db.collection<LockDocument>(collectionName);
  const owner = `${hostname()}:${process.pid}`;
  const now = new Date();
  const lock: LockDocument = {
    _id: LOCK_ID,
    owner,
    acquiredAt: now,
    expiresAt: new Date(now.getTime() + ttlMs),
  };

  try {
    await locks.insertOne(lock);
  } catch (error) {
    if (!(error instanceof MongoServerError && error.code === DUPLICATE_KEY)) {
      throw error;
    }

    const takenOver = await locks.findOneAndUpdate(
      { _id: LOCK_ID, expiresAt: { $lt: now } },
      { $set: lock },
    );

    if (!takenOver) {
      const holder = await locks.findOne({ _id: LOCK_ID });

      throw new MigrationLockedError(
        holder?.owner ?? 'unknown',
        holder?.acquiredAt ?? now,
      );
    }

    logger.warn('migrator_lock_expired_taken_over', {
      previousOwner: takenOver.owner,
      previousAcquiredAt: takenOver.acquiredAt,
    });
  }

  logger.debug('migrator_lock_acquired', { owner });

  const heartbeat = setInterval(() => {
    locks
      .updateOne(
        { _id: LOCK_ID, owner },
        { $set: { expiresAt: new Date(Date.now() + ttlMs) } },
      )
      .then((result) => {
        if (result.matchedCount === 0) {
          logger.error('migrator_lock_lost', { owner });
        }
      })
      .catch((error: unknown) => {
        logger.error('migrator_lock_renewal_failed', { owner, error });
      });
  }, ttlMs / 3);

  heartbeat.unref();

  return {
    async release() {
      clearInterval(heartbeat);
      await locks.deleteOne({ _id: LOCK_ID, owner });
      logger.debug('migrator_lock_released', { owner });
    },
  };
}
