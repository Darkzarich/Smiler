import { apiClient } from '../ApiClient';

const CONTROLLER_URL = 'tags';

export default {
  follow(tag: string) {
    return apiClient.put(`${CONTROLLER_URL}/${tag}/follow`);
  },
  unfollow(tag: string) {
    return apiClient.delete(`${CONTROLLER_URL}/${tag}/follow`);
  },
};
