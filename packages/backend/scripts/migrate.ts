import { MongoClient } from 'mongodb';
import { runCli } from '@smiler/mongodb-migrator';
import Config from '@config/index';
import { logger } from '@libs/logger';
import { createBackendMigrator } from '@libs/migrations';

async function migrate() {
  let client: MongoClient | undefined;

  try {
    process.exitCode = await runCli({
      argv: process.argv.slice(2),
      connect: async () => {
        client = await new MongoClient(Config.DB_URL).connect();

        const db = client.db();

        // The one line that shows a wrong DB_URL before anything runs against it
        logger.info('migrator_connected', {
          database: db.databaseName,
          hosts: client.options.hosts.map(String),
        });

        return createBackendMigrator(db);
      },
    });
  } finally {
    await client?.close();
  }
}

migrate().catch((error: unknown) => {
  logger.error('migrate_failed', { error });
  process.exitCode = 1;
});
