import Query from './_query';

const CONTROLLER_URL = '/posts';

export default {
  getPosts(params) {
    return Query({
      url: CONTROLLER_URL,
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
  updatePostBySlug(slug, data) {
    return Query({
      url: `${CONTROLLER_URL}/${slug}`,
      method: 'put',
      data,
    });
  },
  deletePostBySlug(slug) {
    return Query({
      url: `${CONTROLLER_URL}/${slug}`,
      method: 'delete',
    });
  },
  updateRateBySlug(slug, data) {
    return Query({
      url: `${CONTROLLER_URL}/${slug}/rate`,
      method: 'put',
      data,
    });
  },
  removeRateBySlug(slug) {
    return Query({
      url: `${CONTROLLER_URL}/${slug}/rate`,
      method: 'delete',
    });
  },
};
