import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadMigrations } from '../src/index';

const fixtures = join(__dirname, 'fixtures');

describe('loadMigrations', () => {
  it('loads every migration in the folder, oldest first', async () => {
    const migrations = await loadMigrations(join(fixtures, 'valid'));

    expect(migrations.map(({ id }) => id)).toEqual([
      '20260101-first',
      '20260202-second-one',
    ]);
    expect(migrations.map(({ critical }) => critical)).toEqual([true, false]);
    expect(migrations[1].down).toEqual({
      kind: 'irreversible',
      reason: 'it is a fixture',
    });
  });

  it('refuses a file whose name does not tell its order', async () => {
    await expect(loadMigrations(join(fixtures, 'misnamed'))).rejects.toThrow(
      'first.js is not named <YYYYMMDDHHmmss>-<kebab-case-slug>',
    );
  });

  it('refuses a migration that does not say whether it is critical', async () => {
    await expect(
      loadMigrations(join(fixtures, 'not-critical-said')),
    ).rejects.toThrow('20260101-first.js must say whether it is critical');
  });

  it('orders the first, date-only ids before later ones of the same day', async () => {
    const migrations = await loadMigrations(join(fixtures, 'timestamped'));

    expect(migrations.map(({ id }) => id)).toEqual([
      '20261020235959-day-before',
      '20261021-dated',
      '20261021093000-timestamped',
    ]);
  });
});
