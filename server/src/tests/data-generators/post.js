import defaultsDeep from 'lodash/defaultsDeep';

export function generateRandomPost(overrides = {}) {
  const post = {
    title: 'My post title',
    slug: 'my-post-title-d2k5g8',
    author: '5f5c9a5d2f1c2c1d1f2c3d4e5f6g7h8i9j0',
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
