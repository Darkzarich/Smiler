import { createStore } from 'vuex';
import notifications from './notifications';
import user from './user';

const store = createStore({
  modules: {
    user,
    notifications,
  },
});

export default store;
