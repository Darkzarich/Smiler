import { join } from 'node:path';
import type { Db } from 'mongodb';
import { createMigrator, loadMigrations } from '@smiler/mongodb-migrator';
import { logger } from '@libs/logger';

// `migrations/` sits next to `src/` both in the sources and once compiled into
// `dist/`, so the same relative path finds `.ts` under ts-node and `.js` in the
// image
const MIGRATIONS_DIR = join(__dirname, '../../migrations');

export const MIGRATIONS_GUIDE =
  'stop the backend, back up the database and run the migrator: see packages/mongodb-migrator/README.md';

export async function createBackendMigrator(db: Db) {
  return createMigrator({
    db,
    migrations: await loadMigrations(MIGRATIONS_DIR),
    logger,
  });
}
