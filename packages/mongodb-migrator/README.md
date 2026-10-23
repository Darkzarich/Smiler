# @smiler/mongodb-migrator

Runs a service's MongoDB migrations by hand, records each one in the service's own database, and
reverts them. It knows nothing about Smiler: a service hands it a connected `Db`, its folder of
migrations and its logger, and keeps its migrations to itself.

- [How it works](#how-it-works)
- [Commands](#commands)
- [Running migrations](#running-migrations)
  - [Locally](#locally)
  - [In production (Docker Compose)](#in-production-docker-compose)
  - [Rolling back](#rolling-back)
  - [Backups](#backups)
- [Writing a migration](#writing-a-migration)
- [Adding the migrator to another service](#adding-the-migrator-to-another-service)

## How it works

A migration is a file in the service's `migrations/` folder named
`<YYYYMMDDHHmmss>-<kebab-case-slug>`, a UTC timestamp, which is also its id. Sorting the ids as
strings is the order they apply in. The first few migrations carry only the date
(`20261021-drop-comment-children`) and sort before any later one from the same day.

Each one that has run has a document in the `migrations` collection of the service's database:

```js
// Applied: up ran, and stats is whatever it returned
{ _id: '20261021-drop-comment-children', startedAt, finishedAt, stats: { unsetChildren: 812 } }
// Baselined: recorded as applied without running, because the data was already in its shape
{ _id: '20261021-drop-comment-children', baselined: true, baselinedAt }
```

A migration with no document is **pending**. Nothing runs on its own: the service checks at boot,
and what it does about a pending migration depends on whether the migration is **critical**.

### Critical migrations stop the service from starting

Every migration says whether it is critical, and there is no default:

- `critical: true` means the code that ships with it fails, or damages data, on the old shape. The
  service refuses to start while one is pending: it logs `migrations_critical_pending` and
  `cluster_start_refused` with the ids and exits 1.
- `critical: false` means the code copes until it runs, as with a copy into a new collection or the
  removal of a field nothing reads. The service starts and logs `migrations_pending` as a warning,
  so it can wait for the next maintenance window.

The service also refuses to start when it cannot run the check at all (`migrations_check_failed`),
since then there is no telling whether something critical is pending. Under Docker Compose the
`restart: always` policy keeps retrying, so a database that comes up late only delays the start.

### A new database is baselined

When a service starts against a database that has **no migration records and no documents in
any collection**, every migration it ships is recorded as baselined, one `migration_baselined` log
line each. That database is filled by the current code, so it is already in the shape every
migration produces — a fork of the repo, a fresh local setup, a seeded database. Without this,
the first `up` after a later pull would run every old migration against data that never needed
them. It is the same idea as Rails loading `schema.rb`, or Flyway's `baselineOnMigrate`.

A database that has data but no records is **not** baselined: there is no telling what shape it
is in, so every migration is pending there. If you know better, `baseline --to <id>` records them
by hand.

### One at a time

Every command that writes takes a lock (`migrations_lock` collection) for as long as it runs. A
second migrator against the same database stops with the name of the process holding it. A
holder that died lets go on its own within a minute.

### Logging

The migrator logs a constant event name with the details as metadata, through the logger the
service gives it, so its lines look like the service's own. Every migration logs
`migration_started` and then `migration_finished` (with `durationMs` and `stats`) or
`migration_failed` (with the error). Then come the summaries: `migrations_applied`,
`migration_reverted`, `migrations_baselined`, `migrations_up_to_date` and `migrations_pending`.
A migration's own log lines carry its id and direction.

## Commands

| Command                | What it does                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| `status`               | Lists every migration as `applied`, `baselined`, `pending` or `unknown` (recorded, no file) |
| `up`                   | Applies every pending migration, oldest first, and stops at the first failure               |
| `down`                 | Reverts the newest recorded migration, applied or baselined — one per call                  |
| `baseline [--to <id>]` | Records the pending migrations (up to and including `<id>`) as applied without running      |
| `create <name>`        | Writes a new migration from the template, named with the current time                       |

`--help` after any of them lists its options. `create` writes into `./migrations` of the folder
it runs in, or the folder `--dir <path>` names, and needs no database.

`up`, `down` and `baseline` list what they are about to do and ask before going ahead. `--yes`
skips the question. Without a terminal to ask in, they refuse unless given `--yes`.

A migration that cannot be undone declares it, and `down` stops there with the reason. The way
back from it is the backup.

## Running migrations

Migrations are run with the service stopped: a few minutes of downtime buys a database nobody is
writing to while it changes shape, and a step where a person decides. For Smiler the order is
always:

1. stop the backend,
2. back up the database ([Backups](#backups)),
3. `status`, then `up`,
4. start the new version.

The backend reads `DB_URL` the same way it does for itself, so the migrator connects with the
service's own credentials. Its first line, `migrator_connected`, names the database and hosts. If
those are not the ones you expect, answer no.

### Locally

From the repository root, against the `DB_URL` in `.env`. These run the sources through ts-node:

```bash
pnpm db:migrate status
pnpm db:migrate up          # lists the pending ones and asks
pnpm db:migrate down        # reverts the newest one, asks first
pnpm db:migrate baseline --to 20261021-comment-rating-from-votes
pnpm db:migrate:create rename user bio
```

With the all-in-one Compose setup from the main README, run the backend's own scripts inside the
container instead (the next section lists them). Setting `COMPOSE_FILE` once saves repeating both
`-f` flags:

```bash
export COMPOSE_FILE=docker-compose.yml:docker-compose.local.yml
docker compose run --rm smiler-backend pnpm migrate:status
```

The package is compiled before the backend uses it, and `pnpm install` builds it. After changing
the migrator's own code, run `pnpm --filter mongodb-migrator build`.

### In production (Docker Compose)

Run these from the folder with `docker-compose.yml` and `.env`. The migrator ships inside the
backend image, so it runs as a one-off container of the `smiler-backend` service: the same image,
environment and networks as the backend, no exposed port needed. `run` works while the service
itself is stopped.

The backend's `package.json` has a script for each command, running the compiled migrator:

| Script                | Runs                                                            |
| --------------------- | --------------------------------------------------------------- |
| `pnpm migrate:status` | `status`                                                        |
| `pnpm migrate:up`     | `up`                                                            |
| `pnpm migrate:down`   | `down`                                                          |
| `pnpm migrate <cmd>`  | any command, e.g. `pnpm migrate baseline --to <id>` or `--help` |

Arguments after a script are passed on, so `pnpm migrate:up --yes` works too. The image comes with
pnpm installed, so none of this downloads anything.

```bash
# 1. Keep the image that is running now, to roll back to
docker tag darkzarich/smiler-backend:latest darkzarich/smiler-backend:previous

# 2. Get the new image — it carries the new migrations
docker compose pull smiler-backend      # or: docker compose build smiler-backend

# 3. See what is pending; read-only, so the old backend can still be up
docker compose run --rm smiler-backend pnpm migrate:status

# 4. Stop the backend: the downtime starts here
docker compose stop smiler-backend

# 5. Back up the database, see Backups below

# 6. Apply, answering the prompt once you have read the list
docker compose run --rm smiler-backend pnpm migrate:up

# 7. Start the new version: the downtime ends here
docker compose up -d smiler-backend
docker compose logs smiler-backend | grep migrations_   # migrations_up_to_date
```

Starting the new version before step 6 is safe with a critical migration pending: the backend
refuses to start and says which one, and the old data is untouched.

If step 6 fails, the backend stays stopped. The migrations before the failing one are recorded.
The failing one is not, and `up` runs it again from the start once it is fixed. Every migration
is written so that a second run is safe. If you would rather go back than fix it, restore the
backup and start the previous image ([Rolling back](#rolling-back)).

### Rolling back

Revert with the **new** image, before switching back to the old one. The old image has neither
the new migration nor its `down`.

```bash
docker compose stop smiler-backend
docker compose run --rm smiler-backend pnpm migrate:status
docker compose run --rm smiler-backend pnpm migrate:down   # once per migration

docker tag darkzarich/smiler-backend:previous darkzarich/smiler-backend:latest
docker compose up -d smiler-backend
```

A migration marked irreversible makes `down` stop with its reason. For that one, the way back is
to restore the backup taken before it ran and start the previous image.

### Backups

Taking one is part of running a migration, and it is your job, not the migrator's. The backend
image has no `mongodump`, while the database image has it. Where backups are kept, and for how
long, is a decision for whoever runs the server. Restore one somewhere at least once: a backup
nobody has restored is a guess.

**Production (Docker Compose).** The dump runs inside `smiler-db`, and the archive streams out to
the host:

```bash
set -a; . ./.env; set +a    # the MONGO_INITDB_* variables used below
DB_URI="mongodb://$MONGO_INITDB_ROOT_USERNAME:$MONGO_INITDB_ROOT_PASSWORD@localhost:${DB_PORT:-27017}/$MONGO_INITDB_DATABASE?authSource=admin"

# The whole database
docker compose exec -T smiler-db mongodump --uri "$DB_URI" --archive --gzip \
  > "smiler-$(date +%Y%m%d-%H%M%S).archive.gz"

# Or only what a migration touches: each one names its collections in its header
docker compose exec -T smiler-db mongodump --uri "$DB_URI" --collection comments --archive --gzip \
  > "smiler-comments-$(date +%Y%m%d-%H%M%S).archive.gz"
```

Restore, with the backend stopped. `--drop` replaces each collection in the archive and leaves
the others alone:

```bash
docker compose exec -T smiler-db mongorestore --uri "$DB_URI" --archive --gzip --drop \
  < smiler-20261022-101500.archive.gz
```

**Locally**, with the [database tools](https://www.mongodb.com/docs/database-tools/) installed,
or the same `docker compose exec` commands with the all-in-one setup:

```bash
mongodump --uri "$DB_URL" --archive=smiler.archive.gz --gzip
mongorestore --uri "$DB_URL" --archive=smiler.archive.gz --gzip --drop
```

## Writing a migration

Start from the template, giving the name in words. The timestamp is added for you, in UTC:

```bash
pnpm db:migrate:create rename user bio
# Created .../packages/backend/migrations/20261105093000-rename-user-bio.ts
```

Its `up` and `down` throw until they are written, so running one by mistake records nothing.
Filled in, it looks like this:

```ts
// packages/backend/migrations/20261105093000-rename-user-bio.ts
/*
 * Rename users.bio to users.about.
 *
 * Touches: users.
 */
import { defineMigration } from '@smiler/mongodb-migrator';

export default defineMigration({
  // The new code reads users.about only, so a user's bio would vanish until this runs
  critical: true,

  async up({ db, logger }) {
    const result = await db
      .collection('users')
      .updateMany({ bio: { $exists: true } }, { $rename: { bio: 'about' } });

    logger.info('user_bios_renamed', { count: result.modifiedCount });

    return { renamed: result.modifiedCount };
  },

  async down({ db }) {
    const result = await db
      .collection('users')
      .updateMany({ about: { $exists: true } }, { $rename: { about: 'bio' } });

    return { renamed: result.modifiedCount };
  },
});
```

- **Let `create` name it.** A file not named `<YYYYMMDDHHmmss>-<kebab-case-slug>.ts` stops every
  command, so a typo cannot slip by.
- **Decide whether it is critical**, and say why in a comment next to it
  ([Critical migrations](#critical-migrations-stop-the-service-from-starting)). The template says
  `true`, which is the safe side: when in doubt, keep it.
- **Use the driver, not the models.** `db` is the plain MongoDB `Db`. A model describes the
  schema as it is today, and a migration has to keep working after the model changes again. Do
  not import application code either.
- **Make a second run safe.** Smiler's MongoDB runs without a replica set, so there are no
  transactions. A migration that fails halfway is not recorded and runs again from the start.
  Filter on the old shape (`{ bio: { $exists: true } }`) instead of assuming it.
- **Give `down`, or say why there is none.** A rename, or a value computed from other data, has an exact way
  back. Deleted data does not, so declare it:

  ```ts
  down: irreversible('the duplicate votes it deletes cannot be restored'),
  ```

  `down` runs on baselined migrations as well, so it must work from the shape `up` produces,
  whether or not `up` ever ran on that database.

- **Return stats and log progress.** Whatever `up` and `down` return is logged with
  `migration_finished`, and the return of `up` is also stored on the record. Use `logger` the way
  the backend does: a constant event name, with everything that varies in the metadata.
- **Name what it touches** in the header comment (`Touches: users, rates`), so whoever runs it
  knows what to back up.
- **Indexes are yours.** Mongoose creates the indexes a model declares when the app starts, and
  never drops one it stopped declaring. A migration that needs an index creates it with the
  model's exact key and options. A migration that retires one drops it.
- **Test it** against the in-memory database, from the old shape through `up` and back through
  `down`: see `packages/backend/tests/integration/migrations/`.

## Adding the migrator to another service

1. Add `"@smiler/mongodb-migrator": "workspace:*"` to the service's dependencies (`mongodb` is a
   peer dependency, so the service brings its own driver).
2. Make a `migrations/` folder, compile it with the service, and ship it in the image (the
   backend adds it to its tsconfig `include` and its package `files`).
3. Add a script that hands over to `runCli`, with a `connect` that uses the service's own config.
   It is only called by the commands that need the database, so `create` works without one:

   ```ts
   let client: MongoClient | undefined;

   process.exitCode = await runCli({
     argv: process.argv.slice(2),
     connect: async () => {
       client = await new MongoClient(Config.DB_URL).connect();

       return createMigrator({
         db: client.db(),
         migrations: await loadMigrations(join(__dirname, '../migrations')),
         logger,
       });
     },
   });
   await client?.close();
   ```

4. Call `migrator.check()` once at boot, before the service serves anything. It baselines a new
   database and warns about pending migrations, and it never runs one. It throws
   `CriticalMigrationsPendingError` when a critical one is pending: do not start then.

The backend's `scripts/migrate.ts`, `src/libs/migrations.ts` and the primary in `index.ts` are the
reference.
