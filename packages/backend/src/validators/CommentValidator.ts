import { COMMENT_MAX_BODY_LENGTH } from '@constants/index';
import { ValidationError, ERRORS } from '@errors';

export class CommentValidator {
  static validateBody(body: string | undefined): asserts body is string {
    if (!body) {
      throw new ValidationError(ERRORS.COMMENT_SHOULD_NOT_BE_EMPTY);
    }

    CommentValidator.validateBodyLength(body);
  }

  static validateBodyLength(body: string): void {
    if (body.length > COMMENT_MAX_BODY_LENGTH) {
      throw new ValidationError(ERRORS.COMMENT_BODY_MAX_LENGTH_EXCEEDED);
    }
  }
}
