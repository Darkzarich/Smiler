import Query from './ApiClient';

const CONTROLLER_URL = 'comments';

export default {
  getComments(params) {
    return Query({
      url: CONTROLLER_URL,
      method: 'get',
      params,
    });
  },
  createComment(data) {
    return Query({
      url: CONTROLLER_URL,
      method: 'post',
      data,
    });
  },
  updateComment(id, data) {
    return Query({
      url: `${CONTROLLER_URL}/${id}`,
      method: 'put',
      data,
    });
  },
  deleteComment(id) {
    return Query({
      url: `${CONTROLLER_URL}/${id}`,
      method: 'delete',
    });
  },
  updateRate(id, data) {
    return Query({
      url: `${CONTROLLER_URL}/${id}/vote`,
      method: 'put',
      data,
    });
  },
  removeRate(id) {
    return Query({
      url: `${CONTROLLER_URL}/${id}/vote`,
      method: 'delete',
    });
  },
};
