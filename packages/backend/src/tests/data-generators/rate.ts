import { defaultsDeep } from 'lodash-es';

export function generateRate(overrides = {}) {
  const rate = {
    negative: false,
    target: '5d5467b4c17806706f3df347',
    targetModel: 'Post',
  };

  return defaultsDeep(overrides, rate);
}
