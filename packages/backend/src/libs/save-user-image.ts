import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import Sharp from 'sharp';
import {
  ALLOWED_PICTURE_EXTENSIONS,
  BASE_UPLOAD_FOLDER,
} from '@constants/index';
import { ValidationError } from '@errors';

interface SaveUserImageOptions {
  userId: string;
  /** The encoded picture, however it arrived — a multipart upload or a
   * download from a url the user pasted. */
  input: Buffer;
  width: number;
  height: number;
  /** Error to raise when the bytes turn out not to be a picture this app
   * accepts, so each entry point can phrase it for its own caller. */
  invalidImageMessage: string;
}

/** A picture that decodes to more pixels than this is refused rather than
 * resized: a few hundred kilobytes of well crafted png can otherwise expand
 * into gigabytes of bitmap, and the encoded size limit says nothing about it.
 */
const MAX_INPUT_PIXELS = 50 * 1000 * 1000;

/** Re-encodes a picture and writes it into the user's uploads folder, always
 * as a stripped, resized jpeg.
 *
 * Re-encoding is what makes the bytes safe to serve: whatever the input claimed
 * to be, what lands on disk is a picture Sharp produced, without the metadata,
 * trailing payloads or alternate interpretations the original may have carried.
 *
 * Returns the public path of the file, not its location on disk.
 */
export async function saveUserImage({
  userId,
  input,
  width,
  height,
  invalidImageMessage,
}: SaveUserImageOptions) {
  const image = Sharp(input, {
    failOn: 'error',
    limitInputPixels: MAX_INPUT_PIXELS,
  });

  let format: string | undefined;

  try {
    ({ format } = await image.metadata());
  } catch {
    throw new ValidationError(invalidImageMessage);
  }

  if (!format || !ALLOWED_PICTURE_EXTENSIONS.includes(format)) {
    throw new ValidationError(invalidImageMessage);
  }

  const destination = join(process.cwd(), BASE_UPLOAD_FOLDER, userId);
  const filename = `${randomUUID()}.jpg`;

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  await mkdir(destination, { recursive: true });

  await image
    .resize(width, height, { fit: 'cover', withoutEnlargement: true })
    .jpeg({ quality: 60, progressive: true })
    .toFile(join(destination, filename));

  return `${BASE_UPLOAD_FOLDER}/${userId}/${filename}`;
}
