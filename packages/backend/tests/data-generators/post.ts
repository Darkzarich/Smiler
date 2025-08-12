import { Post } from '@models/Post';
import { defaults } from 'lodash';

export function generateRandomPost(overrides: Partial<Post> = {}) {
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
        type: 'pic',
        isFile: true,
        url: '/uploads/1234/1234.jpg',
      },
      {
        type: 'vid',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      },
    ],
    commentCount: Math.floor(Math.random() * 100),
    rating: Math.floor(Math.random() * 100),
  };

  return defaults(overrides, post);
}
