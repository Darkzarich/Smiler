import AbstractError from './AbstractError.js';

export default class UnauthorizedError extends AbstractError {
  constructor(message) {
    super({
      code: 'Unauthorized',
      status: 401,
      message,
      isOperational: true,
    });
  }
}
