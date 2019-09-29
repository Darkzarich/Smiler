import Vue from 'vue';
import Vuex from 'vuex';

import user from './user';
import notifications from './notifications';

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    user,
    notifications,
  },
});
