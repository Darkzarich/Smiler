const POSTS_INITIAL_COUNT = 20;
const POST_RATE_VALUE = 1;
const POST_MAX_SECTIONS = 8;
const POST_TIME_TO_UPDATE = 1000 * 60 * 10;
const POST_SECTION_TYPES = {
  TEXT: 'text',
  PICTURE: 'pic',
  VIDEO: 'vid',
};
const POST_SECTION_VIDEO_EMBED = {
  YOUTUBE: 'https://www.youtube.com/embed/',
};
const POST_SECTION_VIDEO_REGEXP = {
  YOUTUBE: /((w{3}.)|(https?:\/\/))?((youtube.com\/.*v=(.*))|(youtu\.be\/(.*)))+/,
  OTHERS: /((w{3}.)|(https?:\/\/))?.*\.(webm|avi|mp4|mkv|mov|wmv|flv)+/,
};

const POST_SECTIONS_MAX_LENGTH = 10000;
const POST_TITLE_MAX_LENGTH = 40;


const COMMENT_RATE_VALUE = 0.5;
const COMMENTS_INITIAL_COUNT = 10;
const COMMENTS_NESTED_LIMIT = 10;

const USER_LOGIN_MODE = 0;
const USER_REG_MODE = 1;

const PASSWORD_MIN_LENGTH = 6;

const LOGIN_MIN_LENGTH = 3;
const LOGIN_MAX_LENGTH = 10;

export default {
  POSTS_INITIAL_COUNT,
  POST_RATE_VALUE,
  POST_MAX_SECTIONS,
  POST_SECTION_TYPES,
  POST_SECTION_VIDEO_EMBED,
  POST_SECTION_VIDEO_REGEXP,
  POST_TITLE_MAX_LENGTH,
  POST_SECTIONS_MAX_LENGTH,
  POST_TIME_TO_UPDATE,
  USER_LOGIN_MODE,
  USER_REG_MODE,
  PASSWORD_MIN_LENGTH,
  LOGIN_MIN_LENGTH,
  LOGIN_MAX_LENGTH,
  COMMENT_RATE_VALUE,
  COMMENTS_NESTED_LIMIT,
  COMMENTS_INITIAL_COUNT,
};
