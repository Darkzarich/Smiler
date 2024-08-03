const AbstractError = require('./AbstractError');

class BadRequestError extends AbstractError {
  constructor(message) {
    super({
      code: 'BadRequest',
      status: 400,
      message,
      isOperational: true,
    });
  }
}

module.exports = BadRequestError;
