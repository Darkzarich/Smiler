<template>
  <div>
    <user-profile :data="userInfo"/>

    <div v-if="!loading" class="post-container">
     <div
        v-for="post in posts"
        :key="post.id"
      >
        <post :post="post"/>
      </div>
    </div>
    <div v-else class="loading">
      Loading...
    </div>
  </div>
</template>

<script>
import Post from '@/components/Post/Post.vue';
import UserProfile from '@/components/UserProfile/UserProfile.vue';
import api from '@/api';

import consts from '@/const/const';

export default {
  data() {
    return {
      posts: [],
      userInfo: {},
      loading: false,
    };
  },
  components: {
    Post,
    UserProfile,
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
    async uploadPosts() {
      this.loading = true;

      const res = await api.posts.getPosts({
        author: this.userInfo.login || this.$route.params.login,
        limit: consts.POSTS_INITIAL_COUNT,
      });

      this.posts = res.data.posts;

      this.loading = false;
    },
  },
};
</script>

<style lang="scss">

</style>
