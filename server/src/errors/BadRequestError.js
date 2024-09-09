import AbstractError from './AbstractError.js';

export default class BadRequestError extends AbstractError {
  constructor(message) {
    super({
      code: 'BadRequest',
      status: 400,
      message,
      isOperational: true,
    });
  }
}
