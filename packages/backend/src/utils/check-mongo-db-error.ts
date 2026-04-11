export function isDuplicateKeyError(error: unknown) {
  return (
    error instanceof Error &&
    error.name === 'MongoServerError' &&
    'code' in error &&
    error.code === 11000
  );
}

export function isCastError(error: unknown) {
  return error instanceof Error && error.name === 'CastError';
}

export function isValidationError(error: unknown) {
  return error instanceof Error && error.name === 'ValidationError';
}
