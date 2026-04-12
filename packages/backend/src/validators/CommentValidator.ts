import { COMMENT_MAX_BODY_LENGTH } from '@constants/index';
import { ValidationError, ERRORS } from '@errors';
import sanitizeHtml, {
  hasSanitizedHtmlContent,
  SanitizeHtmlProfile,
} from '@libs/sanitize-html';

export class CommentValidator {
  static validateAndPrepareBody(body: string | undefined) {
    if (!body) {
      throw new ValidationError(ERRORS.COMMENT_SHOULD_NOT_BE_EMPTY);
    }

    CommentValidator.validateBodyLength(body);

    const sanitizedBody = sanitizeHtml(body, SanitizeHtmlProfile.Comment);

    if (!hasSanitizedHtmlContent(sanitizedBody)) {
      throw new ValidationError(ERRORS.COMMENT_SHOULD_NOT_BE_EMPTY);
    }

    return sanitizedBody;
  }

  static validateBodyLength(body: string): void {
    if (body.length > COMMENT_MAX_BODY_LENGTH) {
      throw new ValidationError(ERRORS.COMMENT_BODY_MAX_LENGTH_EXCEEDED);
    }
  }
}
