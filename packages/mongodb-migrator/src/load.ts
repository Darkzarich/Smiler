import { readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { basename, extname, join } from 'node:path';
import type { Migration, MigrationDefinition } from './types';

const CODE_EXTENSIONS = ['.ts', '.js', '.cjs'];

/**
 * A UTC timestamp and a kebab-case slug: sorting the ids as strings is
 * applying order. The first migrations carry only the date, and sort before
 * any later one created on the same day.
 */
export const MIGRATION_ID_REGEX = /^(\d{14}|\d{8})-[a-z0-9-]+$/;

function isCodeFile(file: string) {
  return CODE_EXTENSIONS.includes(extname(file)) && !file.endsWith('.d.ts');
}

function assertDefinition(
  value: unknown,
  file: string,
): asserts value is MigrationDefinition {
  const definition = value as Partial<MigrationDefinition> | undefined;

  if (typeof definition?.up !== 'function') {
    throw new Error(
      `${file} must export default defineMigration({ critical, up, down }) with an up function`,
    );
  }

  if (typeof definition.critical !== 'boolean') {
    throw new Error(
      `${file} must say whether it is critical: true keeps the service from starting until it has run`,
    );
  }

  if (
    typeof definition.down !== 'function' &&
    definition.down?.kind !== 'irreversible'
  ) {
    throw new Error(
      `${file} must give down a function, or irreversible('why') when it cannot be undone`,
    );
  }
}

/**
 * Reads every migration in a folder, sorted into the order they apply in.
 *
 * Files are loaded with `require`, not `import()`: under ts-node only the
 * CommonJS loader compiles `.ts`, and a compiled build only has `.js`.
 */
export async function loadMigrations(dir: string): Promise<Migration[]> {
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const files = (await readdir(dir)).filter(isCodeFile).sort();
  const load = createRequire(join(dir, 'index.js'));
  const seen = new Map<string, string>();

  return files.map((file) => {
    const id = basename(file, extname(file));

    if (!MIGRATION_ID_REGEX.test(id)) {
      throw new Error(
        `${file} is not named <YYYYMMDDHHmmss>-<kebab-case-slug>, so its order cannot be told`,
      );
    }

    if (seen.has(id)) {
      throw new Error(`${file} and ${seen.get(id)} share the id ${id}`);
    }

    seen.set(id, file);

    const path = join(dir, file);
    const loaded = load(path) as { default?: unknown };
    const definition = loaded.default;

    assertDefinition(definition, file);

    return {
      id,
      file: path,
      critical: definition.critical,
      up: definition.up,
      down: definition.down,
    };
  });
}
