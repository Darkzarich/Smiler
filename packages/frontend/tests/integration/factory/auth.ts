import { faker } from '@faker-js/faker';
import defaultsDeep from 'lodash-es/defaultsDeep';
import { authTypes } from '@/api/auth';

/**
 * Factory function to create an authentication fixture with optional overrides.
 *
 * @param overrides - Object containing properties to override in the new profile object.
 * Defaults to `false`.
 * @returns The newly created authentication fixture.
 */
export default function createRandomAuth(
  overrides: Partial<authTypes.CurrentUserResponse> = {},
): authTypes.CurrentUserResponse {
  const auth: Partial<authTypes.CurrentUserResponse> = overrides.isAuth
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
