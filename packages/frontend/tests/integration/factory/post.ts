import { faker } from '@faker-js/faker';
import defaultsDeep from 'lodash-es/defaultsDeep';
import createSection from './section';
import { postTypes } from '@/api/posts';

/**
 * Factory function to create a new post object with optional overrides.
 *
 * @param overrides - An object containing properties to override in
 * the new post object.
 * @return The newly created post object.
 */
export default function createRandomPost(
  overrides: Partial<postTypes.Post> = {},
): postTypes.Post {
  const post: postTypes.Post = {
    title: faker.lorem.sentence(),
    sections: [
      createSection({ type: postTypes.POST_SECTION_TYPES.TEXT }),
      createSection({ type: postTypes.POST_SECTION_TYPES.PICTURE }),
      createSection({ type: postTypes.POST_SECTION_TYPES.VIDEO }),
    ],
    slug: faker.lorem.slug(),
    author: {
      login: faker.internet.userName(),
      id: faker.string.uuid(),
      avatar: faker.image.avatar(),
    },
    id: faker.string.uuid(),
    commentCount: faker.number.int({ min: 0, max: 10 }),
    rating: faker.number.int({ min: 0, max: 5 }),
    createdAt: faker.date.past().toISOString(),
    tags: faker.helpers.arrayElements(['cat', 'dog', 'bird', 'fish', 'fox']),
    rated: {
      isRated: faker.datatype.boolean(),
      negative: faker.datatype.boolean(),
    },
    updatedAt: faker.date.past().toISOString(),
  };

  return defaultsDeep(overrides, post);
}
