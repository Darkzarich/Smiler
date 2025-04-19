import AbstractError from './AbstractError';

export default class ValidationError extends AbstractError {
  constructor(message: string) {
    super({
      code: 'UnprocessableContent',
      status: 422,
      message,
      isOperational: true,
    });
  }
}
