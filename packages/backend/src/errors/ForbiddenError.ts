import AbstractError from './AbstractError';

export default class ForbiddenError extends AbstractError {
  constructor(message: string, code = 'Forbidden') {
    super({
      code,
      status: 403,
      message,
      isOperational: true,
    });
  }
}
