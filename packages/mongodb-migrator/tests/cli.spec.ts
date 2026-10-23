import { mkdir, mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMigrator, irreversible, runCli } from '../src/index';
import { createRecordingLogger, migration, useDatabase } from './helpers';

const newDatabase = useDatabase();

function setup({ isTTY = false }: { isTTY?: boolean } = {}) {
  const db = newDatabase();
  const { logger } = createRecordingLogger();
  const migrator = createMigrator({
    db,
    logger,
    migrations: [
      migration('20260101-a', { critical: true }),
      migration('20260202-b', { down: irreversible('no way back') }),
    ],
  });
  const input = Object.assign(new PassThrough(), { isTTY });
  const output = new PassThrough();
  let printed = '';
  let connections = 0;

  output.on('data', (chunk: Buffer) => {
    printed += chunk.toString();
  });

  const run = (...argv: string[]) =>
    runCli({
      argv,
      connect: async () => {
        connections += 1;

        return migrator;
      },
      input,
      output,
    });

  /** Types into the prompt once it is up, as a person would */
  const answer = async (keys: string) => {
    await vi.waitFor(() => expect(printed).toContain('Continue?'));
    input.write(keys);
  };

  return {
    db,
    run,
    answer,
    printed: () => printed,
    connections: () => connections,
  };
}

describe('runCli', () => {
  it('prints the status of every migration', async () => {
    const { run, printed } = setup();

    expect(await run('status')).toBe(0);
    expect(printed()).toBe(
      [
        'MIGRATION   STATE    AT  REVERSIBLE  CRITICAL',
        '20260101-a  pending      yes         yes',
        '20260202-b  pending      no          no',
        '',
        '2 pending, 1 critical: the service will not start until those have run.',
        '',
      ].join('\n'),
    );
  });

  it('applies with --yes, listing what it applies', async () => {
    const { db, run, printed } = setup();

    expect(await run('up', '--yes')).toBe(0);
    expect(printed()).toContain('Will apply:\n  20260101-a\n  20260202-b\n');
    expect(await db.collection('migrations').countDocuments()).toBe(2);
  });

  it('refuses to change anything without a terminal to ask in or --yes', async () => {
    const { db, run, printed } = setup();

    expect(await run('up')).toBe(1);
    expect(printed()).toContain('pass --yes');
    expect(await db.collection('migrations').countDocuments()).toBe(0);
  });

  it('asks in a terminal and goes ahead on a yes', async () => {
    const { db, run, answer } = setup({ isTTY: true });

    const result = run('up');

    await answer('y\r');

    expect(await result).toBe(0);
    expect(await db.collection('migrations').countDocuments()).toBe(2);
  });

  it('asks in a terminal and changes nothing on a plain enter', async () => {
    const { db, run, answer } = setup({ isTTY: true });

    const result = run('up');

    await answer('\r');

    expect(await result).toBe(0);
    expect(await db.collection('migrations').countDocuments()).toBe(0);
  });

  it('explains why an irreversible migration cannot be reverted', async () => {
    const { run, printed } = setup();

    await run('up', '--yes');

    expect(await run('down', '--yes')).toBe(1);
    expect(printed()).toContain(
      '20260202-b cannot be reverted: no way back. Restore the backup taken before it ran instead.',
    );
  });

  it('rejects an unknown command and --to outside baseline, without connecting', async () => {
    const { run, printed, connections } = setup();

    expect(await run('sideways')).toBe(1);
    expect(await run('up', '--to', '20260101-a')).toBe(1);
    expect(printed()).toContain('Usage: migrate [options] [command]');
    expect(connections()).toBe(0);
  });

  describe('create', () => {
    let dir: string | undefined;

    afterEach(async () => {
      vi.restoreAllMocks();

      if (dir) {
        await rm(dir, { recursive: true });
        dir = undefined;
      }
    });

    it('writes the template into ./migrations, under a timestamp and a slug of the name', async () => {
      dir = await mkdtemp(join(tmpdir(), 'migrator-create-'));
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      await mkdir(join(dir, 'migrations'));
      vi.spyOn(process, 'cwd').mockReturnValue(dir);

      const { run, printed, connections } = setup();

      expect(await run('create', 'Rename', 'user_bio')).toBe(0);

      const migrations = join(dir, 'migrations');
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const files = await readdir(migrations);

      expect(files).toEqual([
        expect.stringMatching(/^\d{14}-rename-user-bio\.ts$/),
      ]);
      expect(printed()).toBe(`Created ${join(migrations, files[0])}\n`);
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      expect(await readFile(join(migrations, files[0]), 'utf8')).toContain(
        'critical: true',
      );
      expect(connections()).toBe(0);
    });

    it('writes into the folder --dir names', async () => {
      dir = await mkdtemp(join(tmpdir(), 'migrator-create-'));

      const { run } = setup();

      expect(await run('create', 'anything', '--dir', dir)).toBe(0);
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      expect(await readdir(dir)).toEqual([
        expect.stringMatching(/^\d{14}-anything\.ts$/),
      ]);
    });

    it('says so when there is no migrations folder', async () => {
      dir = await mkdtemp(join(tmpdir(), 'migrator-create-'));
      vi.spyOn(process, 'cwd').mockReturnValue(dir);

      const { run, printed } = setup();

      expect(await run('create', 'anything')).toBe(1);
      expect(printed()).toContain(
        `There is no migrations folder at ${join(dir, 'migrations')}`,
      );
    });
  });
});
