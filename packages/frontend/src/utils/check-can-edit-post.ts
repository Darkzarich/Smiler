import store from '@/store';
import consts from '@/const/const';

export function checkCanEditPost(post: any): boolean {
  const currentId = store.state.user.id;

  if (!currentId || !post.author || post.author.id !== currentId) {
    return false;
  }

  const dateNow = new Date().getTime();
  const dateCreated = new Date(post.createdAt).getTime();

  if (dateNow - dateCreated > consts.POST_TIME_TO_UPDATE) {
    return false;
  }

  return true;
}
