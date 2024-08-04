const AbstractError = require('./AbstractError');

class ValidationError extends AbstractError {
  constructor(message) {
    super({
      code: 'UnprocessableContent',
      status: 422,
      message,
      isOperational: true,
    });
  }
}

module.exports = ValidationError;
