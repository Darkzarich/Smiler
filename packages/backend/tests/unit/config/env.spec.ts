import { EnvValidationError, parseEnv } from '@config/env';

const validEnv = {
  NODE_ENV: 'development',
  DB_URL: 'mongodb://localhost:27017/smiler?authSource=admin',
  SESSION_SECRET: 'no-secret',
} satisfies NodeJS.ProcessEnv;

describe('env validation', () => {
  it('fills every optional variable with a default', () => {
    const config = parseEnv(validEnv);

    expect(config).toMatchObject({
      PORT: 3000,
      IS_PRODUCTION: false,
      IS_JEST: false,
      LOG_LEVEL: 'debug',
      LOG_FORMAT: 'pretty',
      RATE_LIMIT_ENABLED: true,
      RATE_LIMIT_API_MAX: 100,
    });
  });

  it('treats a key with an empty value as unset', () => {
    const config = parseEnv({
      ...validEnv,
      FRONT_ORIGIN_REMOTE: '',
      RATE_LIMIT_API_MAX: '  ',
    });

    expect(config.FRONT_ORIGIN_REMOTE).toBeUndefined();
    expect(config.RATE_LIMIT_API_MAX).toBe(100);
  });

  it('coerces numeric variables and rejects ones that are not numbers', () => {
    expect(parseEnv({ ...validEnv, BACKEND_PORT: '4000' }).PORT).toBe(4000);

    expect(() => parseEnv({ ...validEnv, RATE_LIMIT_API_MAX: 'lots' })).toThrow(
      /RATE_LIMIT_API_MAX/,
    );
  });

  it('rejects a boolean flag that is neither true nor false', () => {
    expect(
      parseEnv({ ...validEnv, RATE_LIMIT_ENABLED: 'false' }),
    ).toHaveProperty('RATE_LIMIT_ENABLED', false);

    expect(() => parseEnv({ ...validEnv, RATE_LIMIT_ENABLED: 'no' })).toThrow(
      /RATE_LIMIT_ENABLED/,
    );
  });

  it('strips a trailing slash from an origin so it matches the Origin header', () => {
    const config = parseEnv({
      ...validEnv,
      FRONT_ORIGIN_LOCAL: 'http://localhost:8080/',
    });

    expect(config.FRONT_ORIGIN_LOCAL).toBe('http://localhost:8080');
  });

  it('rejects an origin that is not a URL', () => {
    expect(() =>
      parseEnv({ ...validEnv, FRONT_ORIGIN_REMOTE: 'domain.example.com' }),
    ).toThrow(/FRONT_ORIGIN_REMOTE/);
  });

  it('builds a connection string from the database name when DB_URL is unset', () => {
    const config = parseEnv({
      NODE_ENV: 'development',
      DB_PORT: '27019',
      MONGO_INITDB_DATABASE: 'smiler',
    });

    expect(config.DB_URL).toBe(
      'mongodb://localhost:27019/smiler?authSource=admin',
    );
  });

  it('rejects an environment with nothing to connect to the database with', () => {
    expect(() => parseEnv({ NODE_ENV: 'development' })).toThrow(/DB_URL/);
  });

  it('rejects the placeholder session secret in production', () => {
    expect(() => parseEnv({ ...validEnv, NODE_ENV: 'production' })).toThrow(
      /SESSION_SECRET/,
    );

    expect(
      parseEnv({
        ...validEnv,
        NODE_ENV: 'production',
        SESSION_SECRET: 'a-real-secret',
      }).IS_PRODUCTION,
    ).toBe(true);
  });

  it('reports every problem at once', () => {
    let message = '';

    try {
      parseEnv({ NODE_ENV: 'staging', RATE_LIMIT_VOTE_MAX: '-1' });
    } catch (error) {
      expect(error).toBeInstanceOf(EnvValidationError);
      message = (error as Error).message;
    }

    expect(message).toContain('NODE_ENV');
    expect(message).toContain('RATE_LIMIT_VOTE_MAX');
    expect(message).toContain('DB_URL');
  });
});
