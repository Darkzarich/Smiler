import AbstractError from './AbstractError';

export default class ConflictError extends AbstractError {
  constructor(message: string) {
    super({
      code: 'Conflict',
      status: 409,
      message,
      isOperational: true,
    });
  }
}
