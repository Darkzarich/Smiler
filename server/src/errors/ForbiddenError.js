const AbstractError = require('./AbstractError');

class ForbiddenError extends AbstractError {
  constructor(message) {
    super({
      code: 'Forbidden',
      status: 403,
      message,
      isOperational: true,
    });
  }
}

module.exports = ForbiddenError;
