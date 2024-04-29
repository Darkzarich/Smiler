// @ts-check

// TODO: Replace with lodash-es when moving to TypeScript
import cloneDeep from 'lodash/cloneDeep';
import defaultsDeep from 'lodash/defaultsDeep';

const post = {
  title: 'Test post',
  sections: [
    {
      type: 'text',
      hash: '2',
      content: 'test post content',
    },
  ],
  slug: 'test-post-123',
  author: {
    login: 'TestUser',
    id: '1',
  },
  id: '1',
  commentCount: 0,
  rating: 2,
  createdAt: '2023-01-01T00:00:00.000Z',
  tags: ['test_tag1', 'test_tag2'],
  rated: {
    isRated: false,
    negative: false,
  },
};

/**
 * Generates a new post object with optional overrides.
 *
 * @param {object} overrides - An object containing properties to override in
 * the new post object. Default is an empty object.
 * @return {object} The newly generated post object.
 */
export default function generatePost(overrides = {}) {
  const newPost = defaultsDeep(overrides, cloneDeep(post));

  return newPost;
}
