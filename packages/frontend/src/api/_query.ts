import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import config from '@/config/config';
import { useNotificationsStore } from '@/store/notifications';
import { useUserStore } from '@/store/user';

axios.defaults.withCredentials = true;

export default async (requestData: AxiosRequestConfig) => {
  const notificationsStore = useNotificationsStore();
  const userStore = useUserStore();

  const requestDataMod = requestData;

  requestDataMod.url = `${config.VUE_APP_API_URL}/api/${requestDataMod.url}`;

  try {
    return await axios(requestDataMod);
  } catch (e) {
    const error = e as AxiosError;

    const { response } = error;

    if (!response) {
      notificationsStore.showErrorNotification({
        message:
          'Oops! Something went wrong. Please try to reload the page and try again.',
      });

      console.error(error);

      return;
    }

    if (response.data.error) {
      console.error(response.data.error.message);

      notificationsStore.showErrorNotification({
        message: response.data.error.message,
      });
    }

    if (response.status === 401) {
      userStore.clearUser();
    }

    return response;
  }
};
