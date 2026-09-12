/** One field that failed validation, as it is reported to the client. */
export interface ValidationIssue {
  path: string;
  message: string;
}

export default class AbstractError extends Error {
  code: string | number;
  status: number;
  isOperational: boolean;
  /** Set by `ValidationError`: every field that failed, not just the one the
   * `message` describes. */
  details?: ValidationIssue[];

  constructor({
    code = 'Error',
    status = 500,
    message = '',
    isOperational = true,
    details,
  }: {
    code?: string | number;
    status?: number;
    message?: string;
    isOperational?: boolean;
    details?: ValidationIssue[];
  } = {}) {
    super(message);
    this.code = code;
    this.status = status;
    this.isOperational = isOperational;
    this.details = details;
  }
}
