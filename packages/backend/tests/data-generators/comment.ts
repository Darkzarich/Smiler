import { Comment } from '@models/Comment';
import { defaultsDeep } from 'lodash';

export function generateRandomComment(overrides: Partial<Comment> = {}) {
  const comment = {
    post: '5d5467b4c17806706f3df347',
    body: 'test',
    author: '5d5467b4c17806706f3df347',
    rating: Math.floor(Math.random() * 100),
    children: [],
  };

  return defaultsDeep(overrides, comment);
}
