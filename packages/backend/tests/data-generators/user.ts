import { defaultsDeep } from 'lodash';

export function generateRandomUser(overrides = {}) {
  const user = {
    login: `test${Math.random()}`,
    email: 'test@gmail.com',
    avatar: 'https://picsum.photos/200/300',
    salt: 'test',
    hash: 'test',
    rating: 0,
  };

  return defaultsDeep(overrides, user);
}
