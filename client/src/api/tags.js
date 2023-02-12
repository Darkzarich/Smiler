import Query from './_query';

const CONTROLLER_URL = '/tags';

export default {
  follow(tag) {
    return Query({
      url: `${CONTROLLER_URL}/${tag}/follow`,
      method: 'put',
    });
  },
  unfollow(tag) {
    return Query({
      url: `${CONTROLLER_URL}/${tag}/follow`,
      method: 'delete',
    });
  },
};
