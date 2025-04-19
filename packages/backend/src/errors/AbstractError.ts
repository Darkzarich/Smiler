export default class AbstractError extends Error {
  code: string | number;
  status: number;
  isOperational: boolean;

  constructor({
    code = 'Error',
    status = 500,
    message = '',
    isOperational = true,
  } = {}) {
    super(message);
    this.code = code;
    this.status = status;
    this.isOperational = isOperational;
  }
}

