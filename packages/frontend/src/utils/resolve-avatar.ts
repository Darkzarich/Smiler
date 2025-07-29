import defaultAvatar from '@/assets/neutral_avatar.png';

/** Returns avatar stub if avatar is not set */
export function resolveAvatar(path: string): string {
  if (path) {
    return path;
  }

  return defaultAvatar;
}
