import { defaultsDeep } from 'lodash-es';

export function generateRandomPost(overrides = {}) {
  const post = {
    title: 'My post title',
    slug: `my-post-title-d2k5g8${Math.random().toString(36)}`,
    author: '5d5467b4c17806706f3df347',
    tags: ['cat', 'dog', 'bird', 'fish', 'fox'],
    sections: [
      {
        type: 'text',
        content: 'My text section',
      },
      {
        type: 'pic',
        url: 'https://picsum.photos/200/300',
      },
      {
        type: 'vid',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      },
    ],
    commentCount: 0,
    rating: 0,
  };

  return defaultsDeep(overrides, post);
}
