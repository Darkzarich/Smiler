import { faker } from '@faker-js/faker';
import defaultsDeep from 'lodash/defaultsDeep';

/**
 * Factory function to create an authentication fixture with optional overrides.
 *
 * @param {object} [overrides] - Object containing properties to override in the new profile object.
 * Defaults to `false`.
 * @returns {object} The newly created authentication fixture.
 */
export default function createRandomAuth(overrides = {}) {
  const auth = overrides.isAuth
    ? {
        isAuth: true,
        tagsFollowed: faker.helpers.arrayElements([
          'cat',
          'dog',
          'bird',
          'fish',
          'fox',
        ]),
        login: faker.internet.userName(),
        id: faker.string.uuid(),
        rating: faker.number.int({ min: 0, max: 5 }),
        avatar: faker.image.avatar(),
        email: faker.internet.email(),
        followersAmount: faker.number.int({ min: 0, max: 100 }),
      }
    : {
        isAuth: false,
      };

  return defaultsDeep(overrides, auth);
}
