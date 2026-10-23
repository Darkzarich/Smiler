import { MongoClient, type Db } from 'mongodb';
import { afterAll, beforeAll, inject } from 'vitest';
import type {
  Migration,
  MigrationDefinition,
  MigratorLogger,
} from '../src/index';

export interface LoggedEvent {
  level: keyof MigratorLogger;
  event: string;
  metadata?: Record<string, unknown>;
}

export function createRecordingLogger() {
  const events: LoggedEvent[] = [];
  const record =
    (level: LoggedEvent['level']) =>
    (event: string, metadata?: Record<string, unknown>) => {
      events.push({ level, event, metadata });
    };

  const logger: MigratorLogger = {
    debug: record('debug'),
    info: record('info'),
    warn: record('warn'),
    error: record('error'),
  };

  return { logger, events };
}

export function migration(
  id: string,
  definition: Partial<MigrationDefinition> = {},
): Migration {
  return {
    id,
    file: `${id}.ts`,
    critical: false,
    up: async () => undefined,
    down: async () => undefined,
    ...definition,
  };
}

/** A database of its own for every test, on one server for the whole run */
export function useDatabase() {
  const client = new MongoClient(inject('mongoUri'));
  let count = 0;

  beforeAll(async () => {
    await client.connect();
  });

  afterAll(async () => {
    await client.close();
  });

  return (): Db => {
    count += 1;

    return client.db(`test-${process.pid}-${Date.now()}-${count}`);
  };
}
