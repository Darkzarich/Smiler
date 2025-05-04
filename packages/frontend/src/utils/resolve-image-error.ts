import postNoImage from '@/assets/post_no_image.svg';

/** Sets image src to default image if image is not set */
export function resolveImageError(e: Event): void {
  if (!(e.target instanceof HTMLImageElement)) {
    return;
  }

  e.target.src = postNoImage;
}
