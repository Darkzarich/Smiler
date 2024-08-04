const AbstractError = require('./AbstractError');

class UnauthorizedError extends AbstractError {
  constructor(message) {
    super({
      code: 'Unauthorized',
      status: 401,
      message,
      isOperational: true,
    });
  }
}

module.exports = UnauthorizedError;
