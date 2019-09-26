import Vue from 'vue';
import moment from 'moment';
import App from './App.vue';
import router from './router';
import store from './store';

import defaultAvatar from '@/assets/neutral_avatar.png';

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: h => h(App),
}).$mount('#app');

// Mixin for global functions

Vue.mixin({
  methods: {
    $resolveAvatar(path) {
      if (path) {
        return path;
      }
      return defaultAvatar;
    },
  },
  filters: {
    $fromNow(date) {
      return moment(date).fromNow();
    },
  },
});
