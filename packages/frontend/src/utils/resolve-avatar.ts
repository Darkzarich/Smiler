import defaultAvatar from '@/assets/neutral_avatar.png';

export function resolveAvatar(path: string): string {
  if (path) {
    return path;
  }

  return defaultAvatar;
}
