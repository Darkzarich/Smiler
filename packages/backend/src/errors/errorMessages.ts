import { millisecondsToMinutes } from 'date-fns';
import {
  COMMENT_TIME_TO_UPDATE,
  POST_MAX_UPLOAD_IMAGE_SIZE,
  POST_TIME_TO_UPDATE,
} from '../constants/index';

export const ERRORS = {
  NOT_FOUND: 'Not Found',
  UNAUTHORIZED: 'Auth is required for this operation. Please sign in.',

  AUTH_INVALID_CREDENTIALS: 'Invalid email or password',
  AUTH_FIELDS_REQUIRED: 'All fields must be filled.',
  AUTH_PASSWORD_TOO_SHORT: 'Password length must be not less than 6',
  AUTH_LOGIN_WRONG_LENGTH: 'Login length must be 3-15 symbols',
  AUTH_INVALID_EMAIL: 'Email must be valid',
  AUTH_PASSWORDS_NOT_EQUAL: 'Password and password confirm must be equal',
  AUTH_CONFLICT: 'This email or login is already associated with an account',

  USER_NOT_FOUND: 'User is not found',
  USER_CANT_FOLLOW_OWN: 'You cannot follow yourself',
  USER_CANT_FOLLOW_ALREADY_FOLLOWED: 'You cannot follow the same author twice',
  USER_CANT_UNFOLLOW_NOT_FOLLOWED: "You're not following this author",
  USER_CANT_UNFOLLOW_OWN: 'You cannot unfollow yourself',

  TARGET_IS_NOT_RATED: "It's not yet rated by the current user",
  AUTHOR_NOT_FOUND: 'Author is not found',

  COMMENT_SHOULD_NOT_BE_EMPTY: 'Comment should not be empty',
  COMMENT_PARENT_COMMENT_NOT_FOUND: 'Parent commentary is not found',
  COMMENT_NOT_FOUND: 'Comment is not found',
  COMMENT_CANT_RATE_OWN: 'Cannot rate your own comment',
  COMMENT_CANT_RATE_ALREADY_RATED:
    'Cannot rate a comment you have already rated',
  COMMENT_CANT_DELETE_NOT_OWN: 'You can delete only your own comments',
  COMMENT_CANT_EDIT_NOT_OWN: 'You can edit only your own comments',
  COMMENT_CANT_EDIT_WITH_REPLIES:
    'You cannot edit a comment if someone already replied to it',
  COMMENT_CAN_EDIT_WITHIN_TIME: `You can update comment only within the first ${millisecondsToMinutes(COMMENT_TIME_TO_UPDATE)} min`,
  COMMENT_CAN_DELETE_WITHIN_TIME: `You can delete comment only within the first ${millisecondsToMinutes(COMMENT_TIME_TO_UPDATE)} min`,
  COMMENT_LIMIT_PARAM_EXCEEDED: "Limit can't be more than 30",

  POST_NOT_FOUND: 'Post is not found',
  POST_LIMIT_PARAM_EXCEEDED: "Limit can't be more than 15",
  POST_CANT_DELETE_NOT_OWN_POST: 'You can delete only your own posts',
  POST_CANT_DELETE_WITH_COMMENTS: 'You cannot delete post with comments',
  POST_CAN_DELETE_WITHIN_TIME: `You can delete post only within the first ${millisecondsToMinutes(POST_TIME_TO_UPDATE)} min`,
  POST_CAN_EDIT_WITHIN_TIME: `You can edit post only within the first ${millisecondsToMinutes(POST_TIME_TO_UPDATE)} min`,
  POST_CANT_EDIT_NOT_OWN: 'You can edit only your own posts',
  POST_CANT_RATE_ALREADY_RATED: 'Cannot rate a post you have already rated',
  POST_CANT_RATE_OWN: 'Cannot rate your own post',
  POST_ID_REQUIRED: 'Post id must be specified',
  POST_TITLE_REQUIRED: 'Title is required',
  POST_TITLE_MAX_LENGTH_EXCEEDED: 'Exceeded max length of title',
  POST_SECTIONS_REQUIRED: 'At least one section is required',
  POST_TAGS_REQUIRED: 'At least one tag is required',
  POST_MAX_TAGS_EXCEEDED: 'Exceeded max amount of tags',
  POST_TAG_MAX_LEN_EXCEEDED: 'Exceeded max length of a tag',
  POST_SECTIONS_MAX_EXCEEDED: 'Exceeded max amount of sections',
  POST_SECTIONS_MAX_LENGTH_EXCEEDED: 'Exceeded max length of a section',
  POST_UNSUPPORTED_SECTION_TYPE:
    'Unsupported section type. Supported types are: "text", "pic", "vid"',
  POST_TEXT_SECTION_CONTENT_REQUIRED: 'Text section content is required',
  POST_TEXT_SECTIONS_CONTENT_MAX_LENGTH_EXCEEDED:
    'Exceeded max length of text sections content',
  POST_PIC_SECTION_URL_REQUIRED: 'Image section url is required',
  POST_PIC_SECTION_URL_INVALID: 'Invalid image section url',
  POST_VIDEO_SECTION_URL_REQUIRED: 'Video section url is required',
  POST_MAX_UPLOAD_IMAGE_SIZE_EXCEEDED: `Uploaded image is too large. Max allowed size is ${POST_MAX_UPLOAD_IMAGE_SIZE / 1024 / 1024}MB`,
  POST_SEARCH_INVALID_DATE: 'Invalid date',
  POST_INVALID_ATTACHMENT_EXTENSION:
    'Invalid file extension. Only jpg, jpeg, png, gif are allowed.',

  SECTION_NOT_FOUND: 'Section with given hash is not found',
  SECTION_NOT_FILE:
    'This operation cannot be done because this section is not type of picture or not a file',
  TEMPLATE_CANT_SEE_NOT_OWN: 'Can see only your own template',
  TEMPLATE_CANT_SAVE_NOT_OWN: 'Can save template only for yourself',
};
