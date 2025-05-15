<template>
  <div>
    <UserProfile :user="user" />

    <PostsContainer
      :posts="posts"
      :is-loading="isLoading"
      :has-next-page="hasNextPage"
      @fetch-more="handleNextPage"
    >
      <template #no-content>
        This author has not posted anything yet.
      </template>

      <template #no-more-content>
        You've read all the posts this author had posted!
      </template>
    </PostsContainer>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { api } from '@/api';
import PostsContainer from '@/components/PostsContainer/PostsContainer.vue';
import * as consts from '@/const';
import UserProfile from '@components/User/UserProfile.vue';

export default defineComponent({
  components: {
    UserProfile,
    PostsContainer,
  },
  async beforeRouteEnter(to, from, next) {
    try {
      const user = await api.users.getUserProfile(to.params.login as string);

      next((vm) => vm.setUser(user));
    } catch {
      next({
        name: 'NotFound',
      });
    }
  },
  async beforeRouteUpdate(to, from, next) {
    try {
      const user = await api.users.getUserProfile(to.params.login as string);

      this.setUser(user);
      this.fetchPosts();
    } catch {
      next({
        name: 'NotFound',
      });
    }
  },
  data() {
    return {
      posts: [],
      user: {},
      isLoading: false,
      curPage: 0,
      hasNextPage: false,
    };
  },
  async created() {
    this.fetchPosts();
  },
  methods: {
    setUser(user) {
      this.user = user;
    },
    /**
     *
     * @param {Object} options
     * @param {boolean=} options.isCombine - if true, posts are concatenated to the existing array
     */
    async fetchPosts({ isCombine = false } = {}) {
      try {
        this.isLoading = true;

        const data = await api.posts.search({
          author: this.user.login || this.$route.params.login,
          limit: consts.POSTS_INITIAL_COUNT,
          offset: this.curPage * consts.POSTS_INITIAL_COUNT,
        });

        this.hasNextPage = data.hasNextPage;

        if (isCombine) {
          this.posts = this.posts.concat(data.posts);
        } else {
          this.posts = data.posts;
        }
      } finally {
        this.isLoading = false;
      }
    },
    handleNextPage() {
      this.curPage = this.curPage + 1;
      this.fetchPosts({ isCombine: true });
    },
  },
});
</script>
