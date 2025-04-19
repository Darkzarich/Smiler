import AbstractError from './AbstractError';

export default class NotFoundError extends AbstractError {
  constructor(message?: string, isOperational = true) {
    super({
      code: 'NotFound',
      status: 404,
      message: message || 'Not Found',
      isOperational,
    });
  }
}
