import axios from 'axios';
import config from '@/config/config';

axios.defaults.withCredentials = true;

export default (requestData) => {
  const requestDataMod = requestData;
  requestDataMod.url = config.API_ROUTE + requestDataMod.url;

  return axios(requestDataMod).catch((e) => {
    if (e.response) {
      if (e.response.data.error) {
        console.error(e.response.data.error.message);
      }
    } else {
      console.error(e);
    }

    return e.response;
  });
};
