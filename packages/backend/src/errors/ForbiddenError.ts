import AbstractError from './AbstractError';

export default class ForbiddenError extends AbstractError {
  constructor(message) {
    super({
      code: 'Forbidden',
      status: 403,
      message,
      isOperational: true,
    });
  }
}
