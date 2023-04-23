import axios from 'axios';
import config from '@/config/config';
import store from '@/store/index';

axios.defaults.withCredentials = true;

export default (requestData) => {
  const requestDataMod = requestData;
  requestDataMod.url = `${config.VUE_APP_API_URL}/api${requestDataMod.url}`;

  return axios(requestDataMod).catch((e) => {
    if (e.response) {
      if (e.response.data.error) {
        console.error(e.response.data.error.message);

        const notification = {
          error: e.response.data.error,
        };

        store.dispatch('newSystemNotification', notification);
      }

      if (e.response.status === 401) {
        store.commit('clearUser');
      }
    } else {
      // NetworkError type
      console.error(e);
    }

    return e.response;
  });
};
