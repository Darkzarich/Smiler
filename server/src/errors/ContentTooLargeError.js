import AbstractError from './AbstractError.js';

export default class ContentTooLargeError extends AbstractError {
  constructor(message) {
    super({
      code: 'ContentTooLarge',
      status: 413,
      message,
      isOperational: true,
    });
  }
}