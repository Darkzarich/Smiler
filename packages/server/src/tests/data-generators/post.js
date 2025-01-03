import { defaultsDeep } from 'lodash-es';

export function generateRandomPost(overrides = {}) {
  const post = {
    title: 'My post title',
    slug: 'my-post-title-d2k5g8',
    author: '5d5467b4c17806706f3df347',
    tags: ['cat', 'dog', 'bird', 'fish', 'fox'],
    sections: [
      {
        type: 'text',
        text: 'My text section',
      },
      {
        type: 'pic',
        pic: 'https://picsum.photos/200/300',
      },
      {
        type: 'vid',
        vid: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      },
    ],
    commentCount: 0,
    rating: 0,
  };

  return defaultsDeep(overrides, post);
}
