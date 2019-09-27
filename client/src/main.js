import Vue from 'vue';
import moment from 'moment';
import App from './App.vue';
import router from './router';
import store from '@/store/index';
import config from '@/config/config';

import defaultAvatar from '@/assets/neutral_avatar.png';
import postNoImage from '@/assets/post_no_image.png';

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
    $resolveImageError(e) {
      e.target.src = postNoImage;
    },
    $resolveImage(path) {
      if (/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/.test(path)) {
        return path;
      }
      return config.STATIC_ROUTE + path;
    },
  },
  filters: {
    $fromNow(date) {
      return moment(date).fromNow();
    },
  },
});
