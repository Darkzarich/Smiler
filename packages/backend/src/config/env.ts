import { z } from 'zod';

/**
 * The environment contract for the backend.
 *
 * Everything the app reads out of `process.env` is declared here and nowhere
 * else, so a missing or malformed variable stops the process at boot with a
 * list of what is wrong, instead of surfacing hours later as a `NaN` rate
 * limit or a connection string with `undefined` in it.
 */

// `silent` is not a Winston level but a flag on the logger; it is accepted here
// so that one variable turns logging off entirely (a quiet test run, mostly).
const LOG_LEVELS = [
  'error',
  'warn',
  'info',
  'http',
  'verbose',
  'debug',
  'silly',
  'silent',
] as const;

/**
 * `.env` files routinely carry keys with nothing after the `=`, and Docker
 * Compose writes an empty string for any variable it cannot resolve. Both mean
 * "not set", so they have to reach the schema as `undefined` or every optional
 * variable with a default would fail instead of falling back.
 */
const blankAsUnset = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const fromEnv = <T extends z.ZodType>(schema: T) =>
  z.preprocess(blankAsUnset, schema);

/** A whole number of requests per window: `parseInt` used to turn a typo here
 * into a silent `NaN`, which `express-rate-limit` reads as "block everything". */
const rateLimitMax = (fallback: number) =>
  fromEnv(
    z.coerce
      .number({ error: 'must be a whole number of requests' })
      .int({ error: 'must be a whole number of requests' })
      .positive()
      .default(fallback),
  );

/** An origin as a browser sends it in the `Origin` header: no path, no trailing
 * slash. A trailing slash in `.env` would otherwise never match and CORS would
 * reject the frontend with nothing in the logs to explain why. */
const origin = z
  .url({ protocol: /^https?$/ })
  .transform((value) => value.replace(/\/+$/, ''));

const port = () =>
  z.coerce
    .number({ error: 'must be a port number' })
    .int({ error: 'must be a port number' })
    .min(1)
    .max(65535);

const booleanFlag = (fallback: boolean) =>
  fromEnv(
    z
      .enum(['true', 'false', '1', '0'])
      .transform((value) => value === 'true' || value === '1')
      .default(fallback),
  );

// Tests only care about what went wrong, production about what happened,
// and development about everything.
function pickLogLevel(isProduction: boolean, isJest: boolean) {
  if (isJest) {
    return 'error';
  }

  return isProduction ? 'info' : 'debug';
}

const envSchema = z
  .object({
    NODE_ENV: fromEnv(
      z.enum(['development', 'production', 'test']).default('development'),
    ),

    BACKEND_PORT: fromEnv(port().default(3000)),
    FRONTEND_PORT: fromEnv(port().optional()),

    // Either a full connection string, or a database name the fallback below
    // builds one from.
    DB_URL: fromEnv(
      z
        .string()
        .regex(/^mongodb(\+srv)?:\/\//, {
          message: 'must start with mongodb:// or mongodb+srv://',
        })
        .optional(),
    ),
    DB_PORT: fromEnv(port().default(27017)),
    MONGO_INITDB_DATABASE: fromEnv(z.string().optional()),

    SESSION_SECRET: fromEnv(z.string().optional()),

    FRONT_ORIGIN_LOCAL: fromEnv(origin.optional()),
    FRONT_ORIGIN_REMOTE: fromEnv(origin.optional()),

    LOG_LEVEL: fromEnv(z.enum(LOG_LEVELS).optional()),
    LOG_FORMAT: fromEnv(z.enum(['json', 'pretty']).optional()),

    RATE_LIMIT_ENABLED: booleanFlag(true),
    RATE_LIMIT_AUTH_MAX: rateLimitMax(10),
    RATE_LIMIT_API_MAX: rateLimitMax(100),
    RATE_LIMIT_WRITE_MAX: rateLimitMax(30),
    RATE_LIMIT_VOTE_MAX: rateLimitMax(60),
    RATE_LIMIT_UPLOAD_MAX: rateLimitMax(20),
  })
  .transform((env) => {
    const isProduction = env.NODE_ENV === 'production';
    const isJest = env.NODE_ENV === 'test';

    return {
      PORT: env.BACKEND_PORT,
      DB_URL:
        env.DB_URL ??
        `mongodb://localhost:${env.DB_PORT}/${env.MONGO_INITDB_DATABASE}?authSource=admin`,
      IS_PRODUCTION: isProduction,
      IS_JEST: isJest,
      LOG_LEVEL: env.LOG_LEVEL ?? pickLogLevel(isProduction, isJest),
      LOG_FORMAT: env.LOG_FORMAT ?? (isProduction ? 'json' : 'pretty'),
      SESSION_SECRET: env.SESSION_SECRET ?? 'no-secret',
      FRONT_ORIGIN_LOCAL:
        env.FRONT_ORIGIN_LOCAL ??
        `http://localhost:${env.FRONTEND_PORT ?? 8000}`,
      FRONT_ORIGIN_REMOTE: env.FRONT_ORIGIN_REMOTE,
      RATE_LIMIT_ENABLED: env.RATE_LIMIT_ENABLED,
      RATE_LIMIT_AUTH_MAX: env.RATE_LIMIT_AUTH_MAX,
      RATE_LIMIT_API_MAX: env.RATE_LIMIT_API_MAX,
      RATE_LIMIT_WRITE_MAX: env.RATE_LIMIT_WRITE_MAX,
      RATE_LIMIT_VOTE_MAX: env.RATE_LIMIT_VOTE_MAX,
      RATE_LIMIT_UPLOAD_MAX: env.RATE_LIMIT_UPLOAD_MAX,
    };
  });

export type Env = z.infer<typeof envSchema>;

interface EnvIssue {
  variable: string;
  message: string;
}

export class EnvValidationError extends Error {
  constructor(issues: EnvIssue[]) {
    super(
      [
        'Invalid environment configuration:',
        '',
        ...issues.map((issue) => `  • ${issue.variable}: ${issue.message}`),
        '',
        'Check the .env file at the repository root against .env.example.',
      ].join('\n'),
    );

    this.name = 'EnvValidationError';
  }
}

/**
 * The checks that span more than one variable, run against the raw strings.
 *
 * They deliberately do not live in the schema: Zod skips an object-level
 * refinement as soon as any single field fails, so one typo would hide a
 * missing database URL until the next boot. Reading the raw environment here
 * means every problem is reported in the same run.
 */
function checkRelatedVariables(rawEnv: NodeJS.ProcessEnv): EnvIssue[] {
  const issues: EnvIssue[] = [];
  const read = (key: string) =>
    // eslint-disable-next-line security/detect-object-injection
    blankAsUnset(rawEnv[key]) as string | undefined;

  if (!read('DB_URL') && !read('MONGO_INITDB_DATABASE')) {
    issues.push({
      variable: 'DB_URL',
      message:
        'must be set, or MONGO_INITDB_DATABASE must be, to build a local connection string from',
    });
  }

  if (read('NODE_ENV') === 'production') {
    const secret = read('SESSION_SECRET');

    if (!secret || secret === 'no-secret') {
      issues.push({
        variable: 'SESSION_SECRET',
        message:
          'must be set to a real secret in production — the placeholder from .env.example lets anyone forge a session',
      });
    }
  }

  return issues;
}

/** Validates a raw environment and returns the config the app runs on.
 * Throws an `EnvValidationError` listing every problem at once. */
export function parseEnv(rawEnv: NodeJS.ProcessEnv): Env {
  const result = envSchema.safeParse(rawEnv);

  const issues: EnvIssue[] = [
    ...(result.success
      ? []
      : result.error.issues.map((issue) => ({
          variable: issue.path.join('.') || '(root)',
          message: issue.message,
        }))),
    ...checkRelatedVariables(rawEnv),
  ];

  if (issues.length > 0 || !result.success) {
    throw new EnvValidationError(issues);
  }

  return result.data;
}
