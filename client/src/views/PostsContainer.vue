<template>
  <div data-testid="posts-container" class="posts-container">
    <div v-if="loading" class="posts-container__loading">
      <CircularLoader />
    </div>

    <div v-else-if="posts.length > 0" v-scroll="handleScroll">
      <Post
        v-for="post in posts"
        :key="post.id"
        class="posts-container__post"
        :post="post"
        :can-edit="$postCanEdit(post)"
      />
    </div>

    <div v-else class="posts-container__no-posts" data-testid="no-content">
      No content found at the moment. <br />
      Please check back later for updates. <br />
      Thank you.
    </div>

    <div v-if="noMorePost" class="posts-container__no-more">
      Thank you for exploring all available content in this category. <br />
      Please check back later for more updates.
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
  props: ['searchFilter'],
  data() {
    return {
      posts: [],
      loading: false,
      curPage: 0,
      noMorePost: false,
      filters: this.$route.meta.filters,
    };
  },
  watch: {
    '$route.meta': function (newVal) {
      this.filters = newVal.filters;
    },
    filters() {
      this.posts = [];
      this.loading = false;
      this.curPage = 0;
      this.noMorePost = false;
      this.getPosts();
    },
    searchFilter(newVal) {
      if (this.searchFilter) {
        this.filters = newVal;
      }
    },
  },
  created() {
    if (this.searchFilter) {
      this.filters = this.searchFilter;
    } else {
      this.getPosts(this.curPage);
    }
  },
  methods: {
    // "add" param decides if concat of arrays is used
    async getPosts(add) {
      this.loading = true;

      if (this.$route.name !== 'Search' || this.filters) {
        let res;

        if (this.$route.name === 'Feed') {
          res = await api.posts.getFeed({
            limit: consts.POSTS_INITIAL_COUNT,
            offset: 0 + this.curPage * consts.POSTS_INITIAL_COUNT,
          });
        } else {
          res = await api.posts.getPosts({
            limit: consts.POSTS_INITIAL_COUNT,
            offset: 0 + this.curPage * consts.POSTS_INITIAL_COUNT,
            ...this.filters,
          });
        }

        if (res && !res.data.error) {
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
          this.getPosts(true);
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
