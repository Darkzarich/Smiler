import postNoImage from '@/assets/post_no_image.svg';

export function resolveImageError(e: Event): void {
  e.target.src = postNoImage;
}
