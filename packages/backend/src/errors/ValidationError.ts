import AbstractError, { type ValidationIssue } from './AbstractError';

export default class ValidationError extends AbstractError {
  constructor(message: string, details?: ValidationIssue[]) {
    super({
      code: 'UnprocessableContent',
      status: 422,
      message,
      isOperational: true,
      details,
    });
  }
}
