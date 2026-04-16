export function isDuplicateKeyError(error: unknown): error is Error {
  return (
    error instanceof Error &&
    error.name === 'MongoServerError' &&
    'code' in error &&
    error.code === 11000
  );
}

export function getDuplicateKeyField(error: unknown): string | null {
  if (isDuplicateKeyError(error) && 'keyPattern' in error) {
    const { keyPattern } = error as Error & {
      code: number;
      keyPattern: Record<string, number>;
    };
    const keys = Object.keys(keyPattern);

    if (keys.length > 0) {
      return keys[0];
    }
  }

  return null;
}

export function isCastError(error: unknown) {
  return error instanceof Error && error.name === 'CastError';
}

export function isValidationError(error: unknown) {
  return error instanceof Error && error.name === 'ValidationError';
}
