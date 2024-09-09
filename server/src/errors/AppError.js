import AbstractError from './AbstractError.js';

export default class AppError extends AbstractError {
  constructor() {
    super({
      code: 'InternalServerError',
      status: 500,
      message: 'Something went wrong on the server. Please try again later.',
      isOperational: false,
    });
  }
}
