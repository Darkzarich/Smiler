// @ts-check
import defaultsDeep from 'lodash/defaultsDeep';
import cloneDeep from 'lodash/cloneDeep';

const user = {
  avatar: '',
  bio: 'test BIO',
  rating: 0,
  followersAmount: 0,
  login: 'TestUser',
  createdAt: '2023-01-01T02:00:00.000Z',
  id: '1',
  isFollowed: false,
};

/**
 * Generates a new post object with optional overrides.
 *
 * @param {object} overrides - An object containing properties to override in the new post object.
 * Default is an empty object.
 * @return {object} The newly generated post object.
 */
export default function generateUser(overrides = {}) {
  const newUser = defaultsDeep(overrides, cloneDeep(user));

  return newUser;
}
