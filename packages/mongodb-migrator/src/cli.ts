import confirm from '@inquirer/confirm';
import { Command, CommanderError, Option } from 'commander';
import { resolve } from 'node:path';
import { createMigrationFile } from './create';
import type { Confirm, Migrator } from './migrator';
import type { MigrationStatus } from './types';

export interface CliOptions {
  argv: string[];
  /** Called only by the commands that need the database */
  connect: () => Promise<Migrator>;
  input?: NodeJS.ReadableStream & { isTTY?: boolean };
  output?: NodeJS.WritableStream;
}

function formatStatus(statuses: MigrationStatus[]) {
  if (statuses.length === 0) {
    return 'No migrations.\n';
  }

  const yesNo = (value?: boolean) => {
    if (value === undefined) {
      return '';
    }

    return value ? 'yes' : 'no';
  };
  const rows = statuses.map(({ id, state, at, reversible, critical }) => [
    id,
    state,
    at?.toISOString() ?? '',
    yesNo(reversible),
    yesNo(critical),
  ]);
  const header = ['MIGRATION', 'STATE', 'AT', 'REVERSIBLE', 'CRITICAL'];
  const widths = header.map((title, column) =>
    Math.max(title.length, ...rows.map((row) => row.at(column)!.length)),
  );
  const format = (row: string[]) =>
    row
      .map((cell, column) => cell.padEnd(widths.at(column)!))
      .join('  ')
      .trimEnd();
  const pending = statuses.filter(({ state }) => state === 'pending');
  const critical = pending.filter((status) => status.critical).length;
  let summary = 'Nothing pending.';

  if (critical > 0) {
    summary = `${pending.length} pending, ${critical} critical: the service will not start until those have run.`;
  } else if (pending.length > 0) {
    summary = `${pending.length} pending.`;
  }

  return [format(header), ...rows.map(format), '', summary, ''].join('\n');
}

/**
 * Runs one migrator command from command line arguments and resolves to the
 * exit code. Anything that changes data lists what it is about to do and asks
 * first, unless `--yes` is passed.
 */
export async function runCli({
  argv,
  connect,
  input = process.stdin,
  output = process.stdout,
}: CliOptions): Promise<number> {
  let exitCode = 0;

  const ask =
    (verb: string, { yes }: { yes?: boolean }): Confirm =>
    async (ids) => {
      output.write(`${verb}:\n${ids.map((id) => `  ${id}\n`).join('')}`);

      if (yes) {
        return true;
      }

      if (!input.isTTY) {
        output.write('Not a terminal: pass --yes to go ahead.\n');
        exitCode = 1;

        return false;
      }

      try {
        return await confirm(
          { message: 'Continue?', default: false },
          { input, output },
        );
      } catch (error) {
        // Ctrl+C at the prompt
        if (error instanceof Error && error.name === 'ExitPromptError') {
          return false;
        }

        throw error;
      }
    };

  const yesOption = () =>
    new Option('-y, --yes', 'go ahead without asking first');

  const program = new Command('migrate')
    .description('Runs, records and reverts MongoDB migrations.')
    .exitOverride()
    .configureOutput({
      writeOut: (text) => output.write(text),
      writeErr: (text) => output.write(text),
    })
    .showHelpAfterError();

  program
    .command('status')
    .description('list every migration and whether it has run')
    .action(async () => {
      output.write(formatStatus(await (await connect()).status()));
    });

  program
    .command('up')
    .description('apply every pending migration, oldest first')
    .addOption(yesOption())
    .action(async (options: { yes?: boolean }) => {
      await (await connect()).up({ confirm: ask('Will apply', options) });
    });

  program
    .command('down')
    .description('revert the newest applied or baselined migration')
    .addOption(yesOption())
    .action(async (options: { yes?: boolean }) => {
      await (await connect()).down({ confirm: ask('Will revert', options) });
    });

  program
    .command('baseline')
    .description(
      'record the pending migrations as applied without running them',
    )
    .option('--to <id>', 'only up to and including this one')
    .addOption(yesOption())
    .action(async (options: { to?: string; yes?: boolean }) => {
      await (
        await connect()
      ).baseline({
        to: options.to,
        confirm: ask('Will record as applied, without running', options),
      });
    });

  program
    .command('create')
    .description('write a new migration from the template, named for now')
    .argument('<name...>', 'what it does, e.g. rename user bio')
    .option('--dir <path>', 'the migrations folder', './migrations')
    .action(async (words: string[], options: { dir: string }) => {
      const path = await createMigrationFile(
        resolve(options.dir),
        words.join(' '),
      );

      output.write(`Created ${path}\n`);
    });

  try {
    await program.parseAsync(argv, { from: 'user' });
  } catch (error) {
    if (error instanceof CommanderError) {
      return error.exitCode;
    }

    output.write(
      `\n${error instanceof Error ? error.message : String(error)}\n`,
    );

    return 1;
  }

  return exitCode;
}
