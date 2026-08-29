import crypto from 'node:crypto';
import { promisify } from 'node:util';

const pbkdf2 = promisify(crypto.pbkdf2);

export interface PasswordHashParams {
  iterations: number;
  keyLength: number;
  digest: string;
}

/**
 * Parameters every new hash is derived with. Bumping them migrates everyone
 * gradually: stored hashes keep their own params and are re-derived on the
 * next successful sign in, see `needsRehash`
 */
export const CURRENT_HASH_PARAMS: PasswordHashParams = {
  iterations: 210000, // OWASP guidance for PBKDF2-HMAC-SHA512 (2026-08-29)
  keyLength: 64, // the full SHA-512 output, longer keys only cost more
  digest: 'sha512',
};

/** Parameters of the hashes created before `hashParams` was stored on a user. Outdated legacy params */
export const LEGACY_HASH_PARAMS: PasswordHashParams = {
  iterations: 10000,
  keyLength: 512,
  digest: 'sha512',
};

const SALT_BYTES = 16;

function derive(password: string, salt: string, params: PasswordHashParams) {
  return pbkdf2(
    password,
    salt,
    params.iterations,
    params.keyLength,
    params.digest,
  ).then((key) => key.toString('hex'));
}

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(SALT_BYTES).toString('hex');
  const hash = await derive(password, salt, CURRENT_HASH_PARAMS);

  return { hash, salt, hashParams: { ...CURRENT_HASH_PARAMS } };
}

interface StoredPassword {
  hash: string;
  salt: string;
  hashParams?: PasswordHashParams | null;
}

export async function verifyPassword(
  password: string,
  stored: StoredPassword,
): Promise<boolean> {
  const hash = await derive(
    password,
    stored.salt,
    stored.hashParams ?? LEGACY_HASH_PARAMS,
  );

  const given = Buffer.from(hash);
  const expected = Buffer.from(stored.hash);

  // timingSafeEqual throws on a length mismatch, which only happens for a
  // stored hash that doesn't match its own params, so it can't be equal anyway
  if (given.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(given, expected);
}

/** Whether a stored hash was derived with anything but the current params */
export function needsRehash(hashParams?: PasswordHashParams | null): boolean {
  if (!hashParams) {
    return true;
  }

  return (
    hashParams.iterations !== CURRENT_HASH_PARAMS.iterations ||
    hashParams.keyLength !== CURRENT_HASH_PARAMS.keyLength ||
    hashParams.digest !== CURRENT_HASH_PARAMS.digest
  );
}
