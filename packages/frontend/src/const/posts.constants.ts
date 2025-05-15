export const POSTS_INITIAL_COUNT = 15;
export const POST_RATE_VALUE = 1;
export const POST_MAX_SECTIONS = 8;
export const POST_TIME_TO_UPDATE = 1000 * 60 * 10;
export const POST_SECTION_TYPES = {
  TEXT: 'text',
  PICTURE: 'pic',
  VIDEO: 'vid',
};
export const POST_SECTION_VIDEO_EMBED = {
  YOUTUBE: 'https://www.youtube.com/embed/',
};
export const POST_SECTION_VIDEO_REGEXP = {
  YOUTUBE:
    /((w{3}.)|(https?:\/\/))?((youtube.com\/.*v=(.*))|(youtu\.be\/(.*)))+/,
  OTHERS: /((w{3}.)|(https?:\/\/))?.*\.(webm|avi|mp4|mkv|mov|wmv|flv)+/,
};

export const POST_SECTIONS_MAX_LENGTH = 10000;
export const POST_TITLE_MAX_LENGTH = 40;
export const POST_MAX_TAGS = 8;
export const POST_MAX_TAG_LEN = 20;
