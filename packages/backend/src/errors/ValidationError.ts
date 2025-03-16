import AbstractError from './AbstractError';

export default class ValidationError extends AbstractError {
  constructor(message) {
    super({
      code: 'UnprocessableContent',
      status: 422,
      message,
      isOperational: true,
    });
  }
}
