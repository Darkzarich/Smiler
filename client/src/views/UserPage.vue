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

<script>
import api from '@/api';
import PostsContainer from '@/components/PostsContainer/PostsContainer.vue';
import consts from '@/const/const';
import UserProfile from '@components/User/UserProfile.vue';

export default {
  components: {
    UserProfile,
    PostsContainer,
  },
  async beforeRouteEnter(to, from, next) {
    const user = await api.users.getUserProfile(to.params.login);

    if (user.data.error) {
      next({
        name: 'NotFound',
      });
    } else {
      next((vm) => vm.setUser(user.data));
    }
  },
  async beforeRouteUpdate(to, from, next) {
    const user = await api.users.getUserProfile(to.params.login);

    if (user.data.error) {
      next({
        name: 'NotFound',
      });
    } else {
      this.setUser(user.data);
      this.fetchPosts();
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
    async fetchPosts({ isCombine } = {}) {
      this.isLoading = true;

      const res = await api.posts.search({
        author: this.user.login || this.$route.params.login,
        limit: consts.POSTS_INITIAL_COUNT,
        offset: this.curPage * consts.POSTS_INITIAL_COUNT,
      });

      if (res && !res.data.error) {
        this.hasNextPage = res.data.hasNextPage;

        if (isCombine) {
          this.posts = this.posts.concat(res.data.posts);
        } else {
          this.posts = res.data.posts;
        }
      }

      this.isLoading = false;
    },
    handleNextPage() {
      this.curPage = this.curPage + 1;
      this.fetchPosts({ isCombine: true });
    },
  },
};
</script>
