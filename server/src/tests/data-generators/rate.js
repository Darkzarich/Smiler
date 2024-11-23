import defaultsDeep from 'lodash/defaultsDeep';

export function generateRate(overrides = {}) {
  const rate = {
    negative: false,
    target: '5f5c9a5d2f1c2c1d1f2c3d4e5f6g7h8i9j0',
    targetModel: 'Post',
  };

  return defaultsDeep(overrides, rate);
}
