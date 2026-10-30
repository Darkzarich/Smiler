import { minutesToMilliseconds, secondsToMilliseconds } from 'date-fns';

export const BASE_UPLOAD_FOLDER = '/uploads';
export const SESSION_COOKIE_NAME = 'smiler.sid';

export const ALLOWED_PICTURE_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'avif',
];
/** What browsers play in a <video> element. The frontend's
 * `VIDEO_FILE_EXTENSIONS` (utils/parse-video-url.ts) is the same list. */
export const ALLOWED_VIDEO_EXTENSIONS = [
  'mp4',
  'm4v',
  'webm',
  'ogv',
  'ogg',
  'mov',
];

/** The hosts of the video sites the frontend builds a player for, without
 * `www.` or `m.`. The frontend's providers in utils/parse-video-url.ts list the
 * same hosts; a host added on one side only is a link that either cannot be
 * posted or cannot be played. */
export const ALLOWED_VIDEO_EMBEDS = [
  'youtube.com',
  'youtube-nocookie.com',
  'youtu.be',
  'vimeo.com',
  'player.vimeo.com',
  'twitch.tv',
  'clips.twitch.tv',
  'player.twitch.tv',
  'streamable.com',
  'rutube.ru',
  'vk.com',
  'vk.ru',
  'vkvideo.ru',
];

export const POST_TIME_TO_UPDATE = minutesToMilliseconds(10);
export const POST_RATE_VALUE = 1;
export const POST_MAX_TAGS = 8;
export const POST_MAX_TAG_LEN = 20;
export const POST_SECTIONS_MAX = 8;
export const POST_SECTIONS_MAX_LENGTH = 10000;
export const POST_MAX_UPLOAD_IMAGE_SIZE = 3 * 1024 * 1024;
export const POST_TITLE_MAX_LENGTH = 100;
export const POST_BLOWING_RATING_THRESHOLD = 50;
export const POST_MAX_LIMIT = 15;
export const POST_MAX_IMAGE_HEIGHT = 640;
export const POST_MAX_IMAGE_WIDTH = 360;

/** A long scrolled feed asks for its votes in chunks of this many */
export const VOTE_LOOKUP_MAX_IDS = 100;

export const COMMENT_RATE_VALUE = 1;
/** A comment's author gets this share of what a vote moves the comment by. Before,
 * the comment got 0.5 too, and showed halves; see migrations/20261021-*. */
export const COMMENT_AUTHOR_RATING_SHARE = 0.5;
export const COMMENT_TIME_TO_UPDATE = minutesToMilliseconds(10);
export const COMMENT_MAX_LIMIT = 30;
export const COMMENT_MAX_BODY_LENGTH = 10000;
/** A top-level comment is at depth 1. Eight levels is what a desktop column fits. */
export const COMMENT_MAX_DEPTH = 8;

export const USER_MAX_BIO_LENGTH = 300;
export const USER_MAX_AVATAR_LENGTH = 150;
export const USER_AVATAR_SIZE = 200;

/** How long the server is willing to wait on a host it was pointed at, and how
 * many hops it will follow before deciding the url is a redirect loop.
 */
export const EXTERNAL_IMAGE_TIMEOUT = secondsToMilliseconds(10);
export const EXTERNAL_IMAGE_MAX_REDIRECTS = 3;
