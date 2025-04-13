import { AbstractError } from '@errors/index';

export function isDuplicateKeyError(error: AbstractError) {
  return error.name === 'MongoServerError' && error.code === 11000;
}

export function isCastError(error: AbstractError) {
  return error.name === 'CastError';
}

export function isValidationError(error: AbstractError) {
  return error.name === 'ValidationError';
}
