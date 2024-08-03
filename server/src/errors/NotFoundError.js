const AbstractError = require('./AbstractError');

class NotFoundError extends AbstractError {
  constructor(message, isOperational = true) {
    super({
      code: 'NotFound',
      status: 404,
      message: message || 'Not Found',
      isOperational,
    });
  }
}

module.exports = NotFoundError;
