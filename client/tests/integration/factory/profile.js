// @ts-check
import cloneDeep from 'lodash/cloneDeep';
import defaultsDeep from 'lodash/defaultsDeep';

const profile = {
  id: '1',
  avatar: '',
  bio: 'test BIO',
  rating: 0,
  followersAmount: 0,
  login: 'TestUser',
  createdAt: '2023-01-01T02:00:00.000Z',
  isFollowed: false,
};

/**
 * Generates a new profile object with optional overrides.
 *
 * @param {object} [overrides] - Object containing properties to override in
 * the new profile object.
 * @return {object} The newly generated profile object.
 */
export default function generateProfile(overrides) {
  const clonedProfile = cloneDeep(profile);

  if (!overrides) {
    return clonedProfile;
  }

  return defaultsDeep(overrides, clonedProfile);
}
