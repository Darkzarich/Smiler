import { faker } from '@faker-js/faker';
import defaultsDeep from 'lodash/defaultsDeep';
import times from 'lodash/times';

/**
 * Factory function to create a new comment object with optional overrides.
 * By default, the comment object will have no children.
 *
 * @param {object} [overrides] - An object containing properties to override
 * @param {boolean} [withChildren] - Whether to generate child comments for the
 * in the new comment object. Creates 3 levels tree structure if true.
 * @return {object} - The newly created comment object.
 */
export default function createRandomComment(overrides, withChildren = false) {
  const id = faker.string.uuid();

  const comment = {
    body: faker.lorem.sentence(3),
    author: {
      login: faker.internet.userName(),
      id: faker.string.uuid(),
      avatar: faker.image.avatar(),
    },
    id,
    rating: faker.number.int({ min: 0, max: 5 }),
    createdAt: faker.date.past().toISOString(),
    rated: {
      isRated: faker.datatype.boolean(),
      negative: faker.datatype.boolean(),
    },
    deleted: false,
    children: [],
  };

  // Generate children comments if needed
  if (withChildren) {
    comment.children = times(faker.number.int({ min: 1, max: 3 }), () => {
      const childrenComment = createRandomComment({ parent: id });

      // Add children to the children comment creating 3 levels tree structure
      childrenComment.children = [
        createRandomComment({ parent: childrenComment.id }),
      ];

      return childrenComment;
    });
  }

  if (!overrides) {
    return comment;
  }

  return defaultsDeep(overrides, comment);
}
