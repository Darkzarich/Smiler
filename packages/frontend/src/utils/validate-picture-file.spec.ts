import { describe, expect, it } from 'vitest';
import { validatePictureFile } from './validate-picture-file';
import {
  POST_PICTURE_ALLOWED_MIME_TYPES,
  POST_PICTURE_MAX_SIZE,
} from '@/const';

function fileOf(type: string, size = 1024) {
  const file = new File(['x'], 'picture', { type });

  // A File built from a small blob cannot report a big size on its own.
  Object.defineProperty(file, 'size', { value: size });

  return file;
}

describe('validatePictureFile', () => {
  it.each(POST_PICTURE_ALLOWED_MIME_TYPES)('accepts %s', (type) => {
    expect(validatePictureFile(fileOf(type))).toBeNull();
  });

  it('rejects a type the backend would refuse', () => {
    expect(validatePictureFile(fileOf('text/plain'))).toBe(
      'Only JPEG, PNG, GIF, WebP and AVIF images can be uploaded',
    );
  });

  it('rejects a file over the size limit', () => {
    expect(
      validatePictureFile(fileOf('image/png', POST_PICTURE_MAX_SIZE + 1)),
    ).toBe('The picture has to be smaller than 3 MB');
  });

  it('accepts a file exactly at the size limit', () => {
    expect(
      validatePictureFile(fileOf('image/png', POST_PICTURE_MAX_SIZE)),
    ).toBeNull();
  });
});
