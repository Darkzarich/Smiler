import { minutesToMilliseconds } from 'date-fns';

export const BASE_UPLOAD_FOLDER = '/uploads';

export const POST_TIME_TO_UPDATE = minutesToMilliseconds(10);
export const POST_RATE_VALUE = 1;
export const POST_MAX_TAGS = 8;
export const POST_MAX_TAG_LEN = 20;
export const POST_SECTIONS_MAX = 8;
export const POST_SECTIONS_MAX_LENGTH = 10000;
export const POST_MAX_UPLOAD_IMAGE_SIZE = 3 * 1024 * 1024;
export const POST_TITLE_MAX_LENGTH = 40;
export const POST_BLOWING_RATING_THRESHOLD = 50;
export const POST_MAX_LIMIT = 15;
export const POST_MAX_IMAGE_HEIGHT = 640;
export const POST_MAX_IMAGE_WIDTH = 360;

export const COMMENT_RATE_VALUE = 0.5;
export const COMMENT_TIME_TO_UPDATE = minutesToMilliseconds(10);
export const COMMENT_MAX_LIMIT = 30;

export const USER_MAX_BIO_LENGTH = 300;
export const USER_MAX_AVATAR_LENGTH = 150;
