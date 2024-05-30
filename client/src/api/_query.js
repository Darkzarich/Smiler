import axios from 'axios';
import config from '@/config/config';
import store from '@/store/index';

axios.defaults.withCredentials = true;

export default async (requestData) => {
  const requestDataMod = requestData;

  requestDataMod.url = `${config.VUE_APP_API_URL}/api/${requestDataMod.url}`;

  try {
    return await axios(requestDataMod);
  } catch (error) {
    const { response } = error;

    if (!response) {
      store.dispatch('showErrorNotification', {
        message:
          'Oops! Something went wrong. Please try to reload the page and try again.',
      });

      console.error(error);

      return;
    }

    if (response.data.error) {
      console.error(response.data.error.message);

      store.dispatch('showErrorNotification', {
        message: response.data.error.message,
      });
    }

    if (response.status === 401) {
      store.commit('clearUser');
    }

    return response;
  }
};
