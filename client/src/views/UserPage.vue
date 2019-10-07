<template>
  <div>
    <user-profile :data="userInfo"/>

    <div
      v-scroll="handleScroll"
      v-if="!loading || posts.length > 0"
      class="post-container">
     <div
        v-for="post in posts"
        :key="post.id"
      >
        <post :post="post"/>
      </div>
      <div
        v-if="posts.length == 0"
        class="post-container__no-post"
      >
        Author has no posts yet.
      </div>
    </div>
    <div v-if="loading" class="post-loading">
      <loader/>
    </div>
    <div
      v-else-if="noMorePost"
      class="post-container__no-more"
    >
      Congratulations! You've read every post this author had!
    </div>
  </div>
</template>

<script>
import Post from '@/components/Post/Post.vue';
import UserProfile from '@/components/UserProfile/UserProfile.vue';
import api from '@/api';

import loader from '@/library/svg/animation/circularLoader';

import consts from '@/const/const';

export default {
  data() {
    return {
      posts: [],
      userInfo: {},
      loading: false,
      curPage: 0,
      noMorePost: false,
    };
  },
  components: {
    Post,
    UserProfile,
    loader,
  },
  async beforeRouteEnter(to, from, next) {
    const user = await api.users.getUserProfile(to.params.login);

    if (user.data.error) {
      next({
        name: '404',
      });
    } else {
      next(vm => vm.setUserInfo(user.data));
    }
  },
  async beforeRouteUpdate(to, from, next) {
    const user = await api.users.getUserProfile(to.params.login);

    if (user.data.error) {
      next({
        name: '404',
      });
    } else {
      this.setUserInfo(user.data);
      this.uploadPosts();
    }
  },
  async created() {
    this.uploadPosts();
  },
  methods: {
    setUserInfo(user) {
      this.userInfo = user;
    },
    async uploadPosts(add) {
      this.loading = true;

      const res = await api.posts.getPosts({
        author: this.userInfo.login || this.$route.params.login,
        limit: consts.POSTS_INITIAL_COUNT,
        offset: 0 + (this.curPage * consts.POSTS_INITIAL_COUNT),
      });

      if (!res.data.error) {
        if (add) {
          if (res.data.posts.length === 0) {
            this.noMorePost = true;
          } else {
            this.posts = this.posts.concat(res.data.posts);
          }
        } else {
          this.posts = res.data.posts;
          if (res.data.pages === 1) {
            this.noMorePost = true;
          }
        }
      }

      this.loading = false;
    },
    handleScroll(evt, el) {
      if (!this.loading && !this.noMorePost && this.posts.length > 0) {
        const curContainerBounds = el.getBoundingClientRect();
        if (curContainerBounds.height - Math.abs(curContainerBounds.y) < window.innerHeight) {
          this.curPage = this.curPage + 1;
          this.uploadPosts(true);
        }
      }
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/mixins';
@import '@/styles/colors';

  .post-loading {
    @include widget();
    @include flex-row();
    justify-content: center;
  }

  .post-container {
    &__no-post, &__no-more {
      @include widget;
      color: $main-text;
      display: flex;
      justify-content: center;
      font-size: 1.3rem;
    }
    &__no-more, &__no-post {
      margin-left: 10%;
      text-align: center;
      justify-content: none;
    }
  }
</style>
