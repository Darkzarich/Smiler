import moment from 'moment';
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
      return moment(date).fromNow();
    },
  },
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
      const currentLogin = store.getters.getUser.login;

      if (!currentLogin || !post.author || post.author.login !== currentLogin) {
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
      const currentLogin = store.getters.getUser.login;

      if (
        !currentLogin ||
        !comment.author ||
        comment.author.login !== currentLogin
      ) {
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
