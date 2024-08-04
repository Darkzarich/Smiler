const AbstractError = require('./AbstractError');

class ConflictError extends AbstractError {
  constructor(message) {
    super({
      code: 'Conflict',
      status: 409,
      message,
      isOperational: true,
    });
  }
}

module.exports = ConflictError;
