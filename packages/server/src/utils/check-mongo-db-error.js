export function isDuplicateKeyError(error) {
  return error.name === 'MongoError' && error.code === 11000;
}

export function isCastError(error) { return error.name === 'CastError'; }

export function isValidationError(error) { return error.name === 'ValidationError'; }
