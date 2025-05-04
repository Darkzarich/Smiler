import consts from '@/const/const';
import store from '@/store';

export function checkCanEditComment(comment: any): boolean {
  const currentId = store.state.user.id;

  if (!currentId || !comment.author || comment.author.id !== currentId) {
    return false;
  }

  const dateNow = new Date().getTime();
  const dateCreated = new Date(comment.createdAt).getTime();

  if (dateNow - dateCreated > consts.COMMENT_TIME_TO_UPDATE) {
    return false;
  }

  return true;
}
