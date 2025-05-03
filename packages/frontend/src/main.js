import 'normalize.css';
import { formatDistanceToNowStrict } from 'date-fns';
import vClickOutside from 'v-click-outside';
import Vue from 'vue';
import App from './App.vue';
import router from './router';
import defaultAvatar from '@/assets/neutral_avatar.png';
import postNoImage from '@/assets/post_no_image.svg';
import config from '@/config/config';
import consts from '@/const/const';
import store from '@/store/index';

Vue.config.productionTip = false;

Vue.use(vClickOutside);

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
  filters: {
    $fromNow(date) {
      if (!date) {
        return '';
      }

      return formatDistanceToNowStrict(date, {
        addSuffix: true,
        roundingMethod: 'trunc',
      });
    },
  },
  methods: {
    // TODO: Move to store or something
    $isMobile() {
      if (window.matchMedia('(max-device-width: 600px)').matches) {
        return true;
      }

      return false;
    },
    $isDesktop() {
      return !this.$isMobile();
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
      if (
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/.test(
          path,
        )
      ) {
        return path;
      }

      return config.VUE_APP_API_URL + path;
    },
    $videoGenerateEmbedLink(url) {
      try {
        const youtubeRegExp = consts.POST_SECTION_VIDEO_REGEXP.YOUTUBE;
        let matchedURL = url.match(youtubeRegExp);

        if (matchedURL) {
          if (matchedURL.length > 0 && (matchedURL[6] || matchedURL[8])) {
            return `${consts.POST_SECTION_VIDEO_EMBED.YOUTUBE}${matchedURL[6] || matchedURL[8]}`;
          }
        }

        matchedURL = consts.POST_SECTION_VIDEO_REGEXP.OTHERS.test(url);

        if (matchedURL) {
          return url;
        }

        return 'error';
      } catch (e) {
        return 'error';
      }
    },
    $postCanEdit(post) {
      const currentId = store.state.user.id;

      if (!currentId || !post.author || post.author.id !== currentId) {
        return false;
      }

      const dateNow = new Date().getTime();
      const dateCreated = new Date(post.createdAt).getTime();

      if (dateNow - dateCreated > consts.POST_TIME_TO_UPDATE) {
        return false;
      }

      return true;
    },
    $commentCanEdit(comment) {
      const currentId = store.state.user.id;

      if (!currentId || !comment.author || comment.author.id !== currentId) {
        return false;
      }

      const dateNow = new Date().getTime();
      const dateCreated = new Date(comment.createdAt).getTime();

      if (dateNow - dateCreated > consts.COMMENT_TIME_TO_UPDATE) {
        return false;
      }

      return true;
    },
  },
});

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');

import { createApp } from 'vue'