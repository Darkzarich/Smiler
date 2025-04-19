import Query from './_query';

const CONTROLLER_URL = 'posts';

export default {
  search(params) {
    return Query({
      url: CONTROLLER_URL,
      method: 'get',
      params,
    });
  },
  getAll(params) {
    return Query({
      url: `${CONTROLLER_URL}/categories/all`,
      method: 'get',
      params,
    });
  },
  getToday(params) {
    return Query({
      url: `${CONTROLLER_URL}/categories/today`,
      method: 'get',
      params,
    });
  },
  getBlowing(params) {
    return Query({
      url: `${CONTROLLER_URL}/categories/blowing`,
      method: 'get',
      params,
    });
  },
  getRecent(params) {
    return Query({
      url: `${CONTROLLER_URL}/categories/recent`,
      method: 'get',
      params,
    });
  },
  getTopThisWeek(params) {
    return Query({
      url: `${CONTROLLER_URL}/categories/top-this-week`,
      method: 'get',
      params,
    });
  },
  getFeed(params) {
    return Query({
      url: `${CONTROLLER_URL}/feed`,
      method: 'get',
      params,
    });
  },
  createPost(data) {
    return Query({
      url: CONTROLLER_URL,
      method: 'post',
      data,
    });
  },
  uploadAttachment(formData) {
    return Query({
      url: `${CONTROLLER_URL}/upload`,
      method: 'post',
      data: formData,
    });
  },
  getPostBySlug(slug) {
    return Query({
      url: `${CONTROLLER_URL}/${slug}`,
      method: 'get',
    });
  },
  updatePostById(id, data) {
    return Query({
      url: `${CONTROLLER_URL}/${id}`,
      method: 'put',
      data,
    });
  },
  deletePostById(id) {
    return Query({
      url: `${CONTROLLER_URL}/${id}`,
      method: 'delete',
    });
  },
  updateRateById(id, data) {
    return Query({
      url: `${CONTROLLER_URL}/${id}/vote`,
      method: 'put',
      data,
    });
  },
  removeRateById(id) {
    return Query({
      url: `${CONTROLLER_URL}/${id}/vote`,
      method: 'delete',
    });
  },
};
