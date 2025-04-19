import Query from './_query';

const CONTROLLER_URL = 'users';

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
  removeFilePicSection(hash) {
    return Query({
      url: `${CONTROLLER_URL}/me/template/${hash}`,
      method: 'delete',
    });
  },
  getUserTemplate(id) {
    return Query({
      url: `${CONTROLLER_URL}/${id}/template`,
      method: 'get',
    });
  },
  updateUserTemplate(id, data) {
    return Query({
      url: `${CONTROLLER_URL}/${id}/template`,
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
