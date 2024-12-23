import AbstractError from './AbstractError.js';

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
