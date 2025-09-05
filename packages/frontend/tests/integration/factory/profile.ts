import { faker } from '@faker-js/faker';
import defaultsDeep from 'lodash-es/defaultsDeep';
import { userTypes } from '@/api/users';

/**
 * Factory function to create a new profile object with optional overrides.
 *
 * @param overrides - Object containing properties to override in
 * the new profile object.
 * @return The newly created profile object.
 */
export default function createRandomProfile(
  overrides: Partial<userTypes.GetUserProfileResponse> = {},
): userTypes.GetUserProfileResponse {
  const id = faker.string.uuid();

  const profile: userTypes.GetUserProfileResponse = {
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
