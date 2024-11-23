import defaultsDeep from 'lodash/defaultsDeep';

export function generateRandomUser(overrides = {}) {
  const user = {
    login: 'test',
    email: 'test@gmail.com',
    avatar: 'https://picsum.photos/200/300',
    salt: 'test',
    hash: 'test',
  };

  return defaultsDeep(overrides, user);
}
