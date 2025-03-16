import AbstractError from '../errors/AbstractError';

export function isDuplicateKeyError(error: AbstractError) {
  return error.name === 'MongoError' && error.code === 11000;
}

export function isCastError(error: AbstractError) {
  return error.name === 'CastError';
}

export function isValidationError(error: AbstractError) {
  return error.name === 'ValidationError';
}
