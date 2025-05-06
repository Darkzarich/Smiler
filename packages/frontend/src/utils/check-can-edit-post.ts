import consts from '@/const/const';

export function checkCanEditPost(
  post: any,
  currentUserId: string | undefined | null,
): boolean {
  if (!currentUserId || !post.author || post.author.id !== currentUserId) {
    return false;
  }

  const dateNow = new Date().getTime();
  const dateCreated = new Date(post.createdAt).getTime();

  if (dateNow - dateCreated > consts.POST_TIME_TO_UPDATE) {
    return false;
  }

  return true;
}
