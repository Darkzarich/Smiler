import { faker } from '@faker-js/faker';
import defaultsDeep from 'lodash/defaultsDeep';

/**
 * Factory function to create a new profile object with optional overrides.
 *
 * @param {object} [overrides] - Object containing properties to override in
 * the new profile object.
 * @return {object} The newly created profile object.
 */
export default function createRandomProfile(overrides) {
  const id = faker.string.uuid();

  const profile = {
    _id: id,
    id,
    avatar: faker.image.avatar(),
    bio: faker.lorem.sentence(),
    rating: faker.number.int({ min: 0, max: 5 }),
    followersAmount: faker.number.int({ min: 0, max: 100 }),
    login: faker.internet.userName(),
    createdAt: faker.date.past().toISOString(),
    isFollowed: faker.datatype.boolean(),
  };

  if (!overrides) {
    return profile;
  }

  return defaultsDeep(overrides, profile);
}
