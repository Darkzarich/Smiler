<template>
  <div data-testid="posts-container" class="posts-container">
    <div v-if="posts.length > 0" v-scroll="handleScroll">
      <Post
        v-for="post in posts"
        :key="post.id"
        class="posts-container__post"
        :post="post"
        :can-edit="$postCanEdit(post)"
      />
    </div>

    <div
      v-else-if="!loading"
      class="posts-container__no-posts"
      data-testid="no-content"
    >
      No content found at the moment. <br />
      Please check back later for updates. <br />
      Thank you.
    </div>

    <div v-if="isNoMorePosts" class="posts-container__no-more">
      Thank you for exploring all available content in this category. <br />
      Please check back later for more updates.
    </div>

    <div v-if="loading" class="posts-container__loading">
      <CircularLoader />
    </div>
  </div>
</template>

<script>
import api from '@/api';
import consts from '@/const/const';
import Post from '@components/Post/Post.vue';
import CircularLoader from '@icons/animation/CircularLoader.vue';

export default {
  components: {
    Post,
    CircularLoader,
  },
  props: {
    searchFilters: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      posts: [],
      loading: false,
      curPage: 0,
      isNoMorePosts: false,
    };
  },
  watch: {
    '$route.name': function () {
      this.posts = [];
      this.loading = false;
      this.curPage = 0;
      this.isNoMorePosts = false;
      this.getPosts();
    },
    searchFilters(newVal) {
      this.getPosts({ filters: newVal });
    },
  },
  created() {
    this.getPosts();
  },
  methods: {
    /**
     *
     * @param {Object} options
     * @param {boolean} options.isCombine - if true, posts are concatenated to the existing array
     * @param {Object} options.filters - filters to be applied to the request
     */
    async getPosts({ isCombine, filters = this.searchFilters } = {}) {
      this.loading = true;

      const pageRequestsMap = {
        Home: api.posts.getToday,
        All: api.posts.getAll,
        Blowing: api.posts.getBlowing,
        TopThisWeek: api.posts.getTopThisWeek,
        New: api.posts.getRecent,
        Feed: api.posts.getFeed,
        Search: api.posts.search,
      };

      if (!pageRequestsMap[this.$route.name]) {
        return;
      }

      const res = await pageRequestsMap[this.$route.name]({
        limit: consts.POSTS_INITIAL_COUNT,
        offset: 0 + this.curPage * consts.POSTS_INITIAL_COUNT,
        ...filters,
      });

      if (res && !res.data.error) {
        if (isCombine) {
          if (res.data.posts.length === 0) {
            this.isNoMorePosts = true;
          } else {
            this.posts = this.posts.concat(res.data.posts);
          }
        } else {
          this.posts = res.data.posts;
          if (res.data.pages === 1) {
            this.isNoMorePosts = true;
          }
        }
      }

      this.loading = false;
    },
    handleScroll(evt, el) {
      if (!this.loading && !this.isNoMorePosts && this.posts.length > 0) {
        const curContainerBounds = el.getBoundingClientRect();
        if (
          curContainerBounds.height - Math.abs(curContainerBounds.y) <
          window.innerHeight
        ) {
          this.curPage = this.curPage + 1;
          this.getPosts({ isCombine: true });
        }
      }
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/mixins';

.posts-container {
  &__loading,
  &__no-more,
  &__no-posts {
    margin-left: 10%;
    text-align: center;

    @include for-size(phone-only) {
      margin-left: 0% !important;
      border: none !important;
      border-radius: 0 !important;
    }
  }

  &__post {
    margin-bottom: var(--variable-widget-margin);
  }

  &__loading {
    @include widget;
    @include flex-row;

    justify-content: center;
  }

  &__no-posts,
  &__no-more {
    @include widget;

    display: flex;
    justify-content: center;
    color: var(--color-main-text);
    text-align: center;
    font-size: 1.3rem;
    line-height: 1.7rem;
  }
}
</style>
