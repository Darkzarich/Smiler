import Query from './_query';

const CONTROLLER_URL = '/users';

export default {
  getUserProfile(login) {
    return Query({
      url: `${CONTROLLER_URL}/${login}`,
      method: 'get',
    });
  },
  updateUserProfile(data) {
    return Query({
      url: `${CONTROLLER_URL}/me`,
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
  getUserSettings() {
    return Query({
      url: `${CONTROLLER_URL}/me/settings`,
      method: 'get',
    });
  },
};
