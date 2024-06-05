<template>
  <div>
    <UserProfile :user="user" />

    <div
      v-if="!loading || posts.length > 0"
      v-scroll="handleScroll"
      class="post-container"
    >
      <!-- TODO: Add instead PostsContainer -->
      <div v-for="post in posts" :key="post.id">
        <Post class="post-container__post" :post="post" />
      </div>
      <div v-if="posts.length == 0" class="post-container__no-post">
        This author has not posted anything yet.
      </div>
    </div>

    <div v-if="loading" class="post-loading">
      <CircularLoader />
    </div>

    <!-- Move to to a component -->
    <div v-else-if="noMorePost" class="post-container__no-more">
      You've read all the posts this author had posted!
    </div>
  </div>
</template>

<script>
import UserProfile from '@components/User/UserProfile.vue';
import api from '@/api';
import consts from '@/const/const';
import Post from '@components/Post/Post.vue';
import CircularLoader from '@icons/animation/CircularLoader.vue';

export default {
  components: {
    Post,
    UserProfile,
    CircularLoader,
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
      this.uploadPosts();
    }
  },
  data() {
    return {
      posts: [],
      user: {},
      loading: false,
      curPage: 0,
      noMorePost: false,
    };
  },
  async created() {
    this.uploadPosts();
  },
  methods: {
    setUser(user) {
      this.user = user;
    },
    async uploadPosts(add) {
      this.loading = true;

      const res = await api.posts.getPosts({
        author: this.user.login || this.$route.params.login,
        limit: consts.POSTS_INITIAL_COUNT,
        offset: 0 + this.curPage * consts.POSTS_INITIAL_COUNT,
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
        if (
          curContainerBounds.height - Math.abs(curContainerBounds.y) <
          window.innerHeight
        ) {
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
@import '@/styles/variables';

.post-loading {
  @include widget;
  @include flex-row;

  justify-content: center;
}

.post-container {
  &__post {
    margin-bottom: $widget-margin;
  }

  &__no-post,
  &__no-more {
    @include widget;

    @include for-size(phone-only) {
      margin-left: 0% !important;
      border: none !important;
    }

    display: flex;
    justify-content: none;
    margin-left: 10%;
    color: $main-text;
    text-align: center;
    font-size: 1.3rem;
  }
}
</style>
