const AbstractError = require('./AbstractError');

class ContentTooLargeError extends AbstractError {
  constructor(message) {
    super({
      code: 'ContentTooLarge',
      status: 413,
      message,
      isOperational: true,
    });
  }
}

module.exports = ContentTooLargeError;
