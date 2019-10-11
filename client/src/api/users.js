import Query from './_query';

const CONTROLLER_URL = '/users';

export default {
  getUserProfile(login) {
    return Query({
      url: `${CONTROLLER_URL}/${login}`,
      method: 'get',
    });
  },
  checkAuthState() {
    return Query({
      url: `${CONTROLLER_URL}/get-auth`,
      method: 'get',
    });
  },
  updateUserProfile(login, data) {
    return Query({
      url: `${CONTROLLER_URL}/${login}`,
      method: 'put',
      data,
    });
  },
  removeFilePicSection(login, hash) {
    return Query({
      url: `${CONTROLLER_URL}/${login}/template/${hash}`,
      method: 'delete',
    });
  },
  getUserTemplate(login) {
    return Query({
      url: `${CONTROLLER_URL}/${login}/template`,
      method: 'get',
    });
  },
  updateUserTemplate(login, data) {
    return Query({
      url: `${CONTROLLER_URL}/${login}/template`,
      method: 'put',
      data,
    });
  },
  createUser(data) {
    return Query({
      url: CONTROLLER_URL,
      method: 'post',
      data,
    });
  },
  authUser(data) {
    return Query({
      url: `${CONTROLLER_URL}/auth`,
      method: 'post',
      data,
    });
  },
  logoutUser() {
    return Query({
      url: `${CONTROLLER_URL}/logout`,
      method: 'post',
    });
  },
  followUser(id) {
    return Query({
      url: `${CONTROLLER_URL}/${id}/follow`,
      method: 'put',
    });
  },
  unfollowUser(id) {
    return Query({
      url: `${CONTROLLER_URL}/${id}/follow`,
      method: 'delete',
    });
  },
  getUsersFollowing(login) {
    return Query({
      url: `${CONTROLLER_URL}/${login}/following`,
      method: 'get',
    });
  },
};
