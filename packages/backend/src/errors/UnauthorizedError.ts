import AbstractError from './AbstractError';

export default class UnauthorizedError extends AbstractError {
  constructor(message: string) {
    super({
      code: 'Unauthorized',
      status: 401,
      message,
      isOperational: true,
    });
  }
}
