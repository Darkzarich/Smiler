import AbstractError, { type ValidationIssue } from './AbstractError';

export default class ConflictError extends AbstractError {
  constructor(message: string, details?: ValidationIssue[]) {
    super({
      code: 'Conflict',
      status: 409,
      message,
      isOperational: true,
      details,
    });
  }
}
