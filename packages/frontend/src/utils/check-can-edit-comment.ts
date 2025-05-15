import type * as commentTypes from '@/api/comments/types';
import * as consts from '@/const';

export function checkCanEditComment(
  comment: commentTypes.Comment,
  currentUserId?: string,
): boolean {
  if (
    !currentUserId ||
    !comment.author ||
    comment.author.id !== currentUserId
  ) {
    return false;
  }

  const dateNow = new Date().getTime();
  const dateCreated = new Date(comment.createdAt).getTime();

  if (dateNow - dateCreated > consts.COMMENT_TIME_TO_UPDATE) {
    return false;
  }

  return true;
}
