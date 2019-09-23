import Query from './_query';

const CONTROLLER_URL = '/posts/';

export default {
  getPosts(params) {
    return Query({
      url: CONTROLLER_URL,
      method: 'get',
      params,
    });
  },
};
