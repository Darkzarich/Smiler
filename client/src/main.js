import Vue from 'vue';
import vClickOutside from 'v-click-outside';
import moment from 'moment';
import store from '@/store/index';
import config from '@/config/config';
import consts from '@/const/const';

import defaultAvatar from '@/assets/neutral_avatar.png';
import postNoImage from '@/assets/post_no_image.png';
import router from './router';
import App from './App.vue';

Vue.config.productionTip = false;

Vue.use(vClickOutside);

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');

Vue.directive('scroll', {
  inserted(el, binding) {
    const f = (evt) => {
      binding.value(evt, el);
    };
    window.addEventListener('scroll', f);
  },
});

// Mixin for global functions

Vue.mixin({
  methods: {
    $isMobile() {
      if (window.matchMedia('(max-device-width: 599px)').matches) {
        return true;
      }
      return false;
    },
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
      if (/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/.test(path)) {
        return path;
      }
      return config.API_ROUTE + path;
    },
    $videoGenerateEmbedLink(url) {
      try {
        const youtubeRegExp = consts.POST_SECTION_VIDEO_REGEXP.YOUTUBE;
        let mathedURL = url.match(youtubeRegExp);

        if (mathedURL) {
          if (mathedURL.length > 0 && (mathedURL[6] || mathedURL[8])) {
            return `${consts.POST_SECTION_VIDEO_EMBED.YOUTUBE}${mathedURL[6] || mathedURL[8]}`;
          }
        }

        mathedURL = consts.POST_SECTION_VIDEO_REGEXP.OTHERS.test(url);

        if (mathedURL) {
          return url;
        }

        return 'error';
      } catch (e) {
        return 'error';
      }
    },
    $postCanEdit(post) {
      const curUser = store.getters.getUser.login;

      if (curUser) {
        if (post.author.login !== curUser) {
          return false;
        }

        const dateNow = new Date().getTime();
        if (dateNow - new Date(post.createdAt).getTime() > consts.POST_TIME_TO_UPDATE) {
          return false;
        }
        return true;
      }

      return false;
    },
    $commentCanEdit(comment) {
      const curUser = store.getters.getUser.login;

      if (curUser) {
        if (comment.author.login !== curUser) {
          return false;
        }

        const dateNow = new Date().getTime();
        if (dateNow - new Date(comment.createdAt).getTime() > consts.COMMENT_TIME_TO_UPDATE) {
          return false;
        }
        return true;
      }

      return false;
    },
  },
  filters: {
    $fromNow(date) {
      return moment(date).fromNow();
    },
  },
});
