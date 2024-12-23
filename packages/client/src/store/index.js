import Vue from 'vue';
import Vuex from 'vuex';
import notifications from './notifications';
import user from './user';

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    user,
    notifications,
  },
});
