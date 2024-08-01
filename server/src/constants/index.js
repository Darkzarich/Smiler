const { minutesToMilliseconds } = require('date-fns');

module.exports = {
  POST_ATTACHMENTS_LIMIT: 8,
  POST_TIME_TO_UPDATE: minutesToMilliseconds(10),
  COMMENT_TIME_TO_UPDATE: minutesToMilliseconds(10),
  POST_RATE_VALUE: 1,
  POST_SECTION_TYPES: {
    TEXT: 'text',
    PICTURE: 'pic',
    VIDEO: 'vid',
  },
  POST_MAX_TAGS: 8,
  POST_MAX_TAG_LEN: 20,
  POST_SECTIONS_MAX: 8,
  POST_SECTIONS_MAX_LENGTH: 10000,
  POST_TITLE_MAX_LENGTH: 40,
  COMMENT_RATE_VALUE: 0.5,
  USER_MAX_BIO_LENGTH: 300,
  USER_MAX_AVATAR_LENGTH: 150,
  TAGS_MAX_LENGTH: 20,
};
