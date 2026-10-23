import type { Db } from 'mongodb';

export type LogMetadata = Record<string, unknown>;

/**
 * What the migrator logs through. Every message is a constant event name and
 * everything that varies goes in the metadata, so a Winston logger fits as is.
 */
export interface MigratorLogger {
  debug(event: string, metadata?: LogMetadata): unknown;
  info(event: string, metadata?: LogMetadata): unknown;
  warn(event: string, metadata?: LogMetadata): unknown;
  error(event: string, metadata?: LogMetadata): unknown;
}

export type Direction = 'up' | 'down';

export interface MigrationContext {
  db: Db;
  /** Stamps every line with the migration and the direction it is running in */
  logger: MigratorLogger;
}

/** Whatever a run returns is stored on its record as `stats` */
export type MigrationFunction = (context: MigrationContext) => Promise<unknown>;

export interface Irreversible {
  kind: 'irreversible';
  reason: string;
}

export interface MigrationDefinition {
  /**
   * Whether the service must not start while this is pending: true when the
   * code that ships with it fails on data in the old shape, false when it
   * copes and the migration can wait for the next maintenance window
   */
  critical: boolean;
  up: MigrationFunction;
  down: MigrationFunction | Irreversible;
}

export interface Migration extends MigrationDefinition {
  /** The file name without its extension, e.g. `20261105093000-rename-user-bio` */
  id: string;
  file: string;
}

export interface AppliedRecord {
  _id: string;
  startedAt: Date;
  finishedAt: Date;
  stats?: unknown;
}

/** A migration recorded as applied without running, because the data was
 * already in its shape */
export interface BaselinedRecord {
  _id: string;
  baselined: true;
  baselinedAt: Date;
}

export type MigrationRecord = AppliedRecord | BaselinedRecord;

export type MigrationState =
  | 'applied'
  | 'baselined'
  | 'pending'
  /** Recorded in the database, but no file in this build has its id */
  | 'unknown';

export interface MigrationStatus {
  id: string;
  state: MigrationState;
  at?: Date;
  /** Neither is known for an `unknown` migration */
  reversible?: boolean;
  critical?: boolean;
}

/** Keeps the exact type it is given, so a test can call `down` directly */
export function defineMigration<T extends MigrationDefinition>(definition: T) {
  return definition;
}

export function irreversible(reason: string): Irreversible {
  return { kind: 'irreversible', reason };
}

export function isIrreversible(
  down: MigrationDefinition['down'],
): down is Irreversible {
  return typeof down !== 'function';
}

export function isBaselined(
  record: MigrationRecord,
): record is BaselinedRecord {
  return 'baselined' in record && record.baselined;
}
