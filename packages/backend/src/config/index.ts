import { config } from 'dotenv';
import { resolve } from 'path';
import { EnvValidationError, parseEnv } from './env';

config({ path: resolve(process.cwd(), '../../.env') });

function loadConfig() {
  try {
    return parseEnv(process.env);
  } catch (error) {
    if (!(error instanceof EnvValidationError)) {
      throw error;
    }

    // The logger reads this module for its level and format, so it cannot be
    // used to report a config that failed to load. Nothing has started at this
    // point anyway — there is no connection to drain and no worker to replace.
    // eslint-disable-next-line no-console
    console.error(error.message);
    process.exit(1);
  }
}

export default loadConfig();
