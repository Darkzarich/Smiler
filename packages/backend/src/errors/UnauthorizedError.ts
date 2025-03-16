import AbstractError from './AbstractError';

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
