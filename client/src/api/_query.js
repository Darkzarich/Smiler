import axios from 'axios';
import config from '@/config/config';
import store from '@/store/index';

axios.defaults.withCredentials = true;

export default (requestData) => {
  const requestDataMod = requestData;
  requestDataMod.url = config.API_ROUTE + requestDataMod.url;

  return axios(requestDataMod).catch((e) => {
    if (e.response) {
      if (e.response.data.error) {
        console.error(e.response.data.error.message);

        const notif = {
          error: e.response.data.error,
        };

        store.dispatch('newSystemNotification', notif);
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
