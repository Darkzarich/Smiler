import {
  POST_PICTURE_ALLOWED_MIME_TYPES,
  POST_PICTURE_MAX_SIZE,
} from '@/const';

/** The same verdict for a file whether it was dropped on a section or picked
 * from the file dialog, so the two ways in cannot disagree. Returns the reason
 * to show the user, or null when the file is fine — the backend checks all of
 * this again, this only saves spending an upload to hear it.
 */
export function validatePictureFile(file: File): string | null {
  if (!POST_PICTURE_ALLOWED_MIME_TYPES.includes(file.type)) {
    return 'Only JPEG, PNG, GIF, WebP and AVIF images can be uploaded';
  }

  if (file.size > POST_PICTURE_MAX_SIZE) {
    return `The picture has to be smaller than ${POST_PICTURE_MAX_SIZE / 1024 / 1024} MB`;
  }

  return null;
}
