import AbstractError from './AbstractError';

export default class ForbiddenError extends AbstractError {
  constructor(message: string) {
    super({
      code: 'Forbidden',
      status: 403,
      message,
      isOperational: true,
    });
  }
}
