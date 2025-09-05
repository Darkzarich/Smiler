import { faker } from '@faker-js/faker';
import defaultsDeep from 'lodash-es/defaultsDeep';
import times from 'lodash-es/times';
import { commentTypes } from '@/api/comments';

/**
 * Factory function to create a new comment object with optional overrides.
 * By default, the comment object will have no children.
 *
 * @param overrides - An object containing properties to override
 * @param withChildren - Whether to generate child comments for the
 * in the new comment object. Creates 3 levels tree structure if true.
 * @return The newly created comment object.
 */
export default function createRandomComment(
  overrides: Partial<commentTypes.Comment>,
  withChildren = false,
): commentTypes.Comment {
  const id = faker.string.uuid();

  const comment: commentTypes.Comment = {
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
    updatedAt: faker.date.past().toISOString(),
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
