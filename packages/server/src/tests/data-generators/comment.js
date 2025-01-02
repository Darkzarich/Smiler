import { defaultsDeep } from 'lodash-es';

export function generateRandomComment(overrides = {}) {
  const comment = {
    post: '5d5467b4c17806706f3df347',
    body: 'test',
    author: '5d5467b4c17806706f3df347',
  };

  return defaultsDeep(overrides, comment);
}
