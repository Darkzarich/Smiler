import Query from './_query';

const CONTROLLER_URL = 'auth';

export default {
  getAuth() {
    return Query({
      url: `${CONTROLLER_URL}/current`,
      method: 'get',
    });
  },
  signIn(data) {
    return Query({
      url: `${CONTROLLER_URL}/signin`,
      method: 'post',
      data,
    });
  },
  signUp(data) {
    return Query({
      url: `${CONTROLLER_URL}/signup`,
      method: 'post',
      data,
    });
  },
  logout() {
    return Query({
      url: `${CONTROLLER_URL}/logout`,
      method: 'post',
    });
  },
};
