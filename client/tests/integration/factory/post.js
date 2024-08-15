// TODO: Replace with lodash-es when moving to TypeScript
import { faker } from '@faker-js/faker';
import cloneDeep from 'lodash/cloneDeep';
import defaults from 'lodash/defaults';
import createSection from './section';

/**
 * Factory function to create a new post object with optional overrides.
 *
 * @param {object} [overrides] - An object containing properties to override in
 * the new post object.
 * @return {object} The newly created post object.
 */
export default function createRandomPost(overrides = {}) {
  const post = {
    title: faker.lorem.sentence(),
    sections: [
      createSection({ type: 'text' }),
      createSection({ type: 'pic' }),
      createSection({ type: 'video' }),
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
  };

  const clonedPost = cloneDeep(post);

  if (!overrides) {
    return clonedPost;
  }

  return defaults(overrides, clonedPost);
}
