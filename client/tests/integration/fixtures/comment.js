// @ts-check
import defaultsDeep from 'lodash/defaultsDeep';
import cloneDeep from 'lodash/cloneDeep';

const comment = {
  body: 'test comment',
  author: {
    avatar: '',
    login: 'TestUser',
    id: '1',
  },
  id: '1',
  rating: 0,
  createdAt: '2023-01-01T00:00:00.000Z',
  rated: {
    isRated: false,
    negative: false,
  },
  children: [
    {
      id: '2',
      parent: '1',
      body: 'test comment 2',
      author: {
        avatar: '',
        login: 'TestUser2',
        id: '2',
      },
      rating: 0,
      createdAt: '2023-01-01T01:00:00.000Z',
      rated: {
        isRated: false,
        negative: false,
      },
      children: [
        {
          id: '3',
          parent: '2',
          body: 'test comment 3',
          author: {
            avatar: '',
            login: 'TestUser3',
            id: '3',
          },
          rating: 0,
          createdAt: '2023-01-01T02:00:00.000Z',
          rated: {
            isRated: false,
            negative: false,
          },
          children: [],
        },
      ],
    },
  ],
};

/**
 * Generates a new comment object by merging overrides with the default comment object.
 *
 * @param {object} overrides - An object containing properties to override
 * in the new comment object. Defaults to an empty object.
 * @return {object} The new comment object.
 */
export default function generateComment(overrides = {}) {
  const newComment = defaultsDeep(overrides, cloneDeep(comment));

  return newComment;
}
