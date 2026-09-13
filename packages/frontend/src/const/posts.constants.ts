export const POSTS_INITIAL_COUNT = 15;
export const POST_RATE_VALUE = 1;
export const POST_MAX_SECTIONS = 8;
export const POST_TIME_TO_UPDATE = 1000 * 60 * 10;
export const POST_SECTION_VIDEO_EMBED = {
  YOUTUBE: 'https://www.youtube.com/embed/',
};
export const POST_SECTION_VIDEO_REGEXP = {
  YOUTUBE:
    /((w{3}.)|(https?:\/\/))?((youtube.com\/.*v=(.*))|(youtu\.be\/(.*)))+/,
  OTHERS: /((w{3}.)|(https?:\/\/))?.*\.(webm|avi|mp4|mkv|mov|wmv|flv)+/,
};

export const POST_SECTIONS_MAX_LENGTH = 10000;
export const POST_TITLE_MAX_LENGTH = 100;
export const POST_MAX_TAGS = 8;
export const POST_MAX_TAG_LEN = 20;

/* Both mirror the limits the upload endpoint enforces — ALLOWED_UPLOAD_MIME_TYPES
   and POST_MAX_UPLOAD_IMAGE_SIZE in packages/backend/src/controllers/posts/upload.ts.
   The file is already in the browser, so a rejection costs nothing here and an
   upload there. */
export const POST_PICTURE_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
];

export const POST_PICTURE_MAX_SIZE = 3 * 1024 * 1024;
