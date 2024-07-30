import cloneDeep from 'lodash/cloneDeep';
import defaultsDeep from 'lodash/defaultsDeep';

const auth = {
  isAuth: false,
  tagsFollowed: ['test-tag', 'test-tag2'],
  login: 'TestUser',
  rating: 0,
  avatar: '',
  email: 'test@gmail.com',
  followersAmount: 0,
};

/**
 * Generates an authentication fixture with optional overrides.
 *
 * @param {object} [overrides] - Object containing properties to override in the new profile object.
 * Defaults to `false`.
 * @returns {object} The newly generated authentication fixture.
 */
export default function generateAuth(overrides) {
  const clonedAuth = cloneDeep(auth);

  if (!overrides) {
    return clonedAuth;
  }

  return defaultsDeep(overrides, clonedAuth);
}
