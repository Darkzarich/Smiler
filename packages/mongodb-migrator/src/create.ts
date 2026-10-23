import { stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { MIGRATION_ID_REGEX } from './load';

const TEMPLATE = `/*
 * <What it changes, and why.>
 *
 * Touches: <the collections it changes, for whoever backs them up>.
 */
import { defineMigration } from '@smiler/mongodb-migrator';

export default defineMigration({
  // true keeps the service from starting until this has run: the code that
  // ships with it fails on the old shape. false when it copes until then.
  critical: true,

  async up({ db, logger }) {
    throw new Error('up is not written yet');
  },

  async down({ db, logger }) {
    throw new Error('down is not written yet');
  },
});
`;

/** `20261105093000` for 2026-11-05 09:30:00 UTC */
function timestamp(date: Date) {
  return date.toISOString().replace(/\D/g, '').slice(0, 14);
}

/** "Rename user bio" and "rename_user_bio" are both `rename-user-bio` */
function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Writes a new migration from the template into `dir`, named with the current
 * UTC time and a slug of `name`, and resolves to its path.
 */
export async function createMigrationFile(
  dir: string,
  name: string,
  now = new Date(),
) {
  const id = `${timestamp(now)}-${toSlug(name)}`;

  if (!MIGRATION_ID_REGEX.test(id)) {
    throw new Error(
      `"${name}" has nothing to make a slug of: use letters and digits`,
    );
  }

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const folder = await stat(dir).catch(() => undefined);

  if (!folder?.isDirectory()) {
    throw new Error(`There is no migrations folder at ${dir}`);
  }

  const path = join(dir, `${id}.ts`);

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  await writeFile(path, TEMPLATE, { flag: 'wx' });

  return path;
}
