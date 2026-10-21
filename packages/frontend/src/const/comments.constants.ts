export const COMMENT_RATE_VALUE = 1;
export const COMMENTS_INITIAL_COUNT = 10;
export const COMMENT_TIME_TO_UPDATE = 1000 * 60 * 10; // 10 min
export const COMMENT_AUTO_HIDE_LEVEL = 3;
/** How many levels of replies indent before the rest of a thread goes flat.
 * The backend stops nesting at 8 anyway. */
export const COMMENT_VISIBLE_DEPTH = { phone: 3, tablet: 5, desktop: 8 };
