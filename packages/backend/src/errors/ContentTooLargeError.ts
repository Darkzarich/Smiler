import AbstractError from './AbstractError';

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
