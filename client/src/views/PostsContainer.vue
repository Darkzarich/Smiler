<template>
  <div data-testid="posts-container">
    <div
      v-if="!loading || posts.length > 0"
      v-scroll="handleScroll"
      class="post-container"
    >
      <div
        v-for="post in posts"
        :key="post.id"
      >
        <Post
          :post="post"
          :can-edit="$postCanEdit(post)"
        />
      </div>
      <div
        v-if="posts.length == 0"
        class="post-container__no-post"
      >
        We're sorry. No posts for this time yet.
      </div>
    </div>
    <div
      v-if="loading"
      class="post-loading"
    >
      <CircularLoader />
    </div>
    <div
      v-else-if="noMorePost"
      class="post-container__no-more"
    >
      Congratulations! You've read everything available. Thanks! Please, come
      later to see more!
    </div>
  </div>
</template>

<script>
import api from '@/api';
import Post from '@/components/Post/Post.vue';
import consts from '@/const/const';
import CircularLoader from '@/library/svg/animation/CircularLoader.vue';

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
@import '@/styles/colors';

.post-loading {
  @include widget;
  @include flex-row;

  justify-content: center;
  margin-left: 10%;

  @include for-size(phone-only) {
    margin-left: 0%;
    border: none !important;
  }
}

.post-container {
  &__no-post,
  &__no-more {
    @include widget;

    color: $main-text;
    display: flex;
    justify-content: center;
    font-size: 1.3rem;

    @include for-size(phone-only) {
      margin-left: 0% !important;
      border: none !important;
    }
  }

  &__no-more {
    margin-left: 10%;
    text-align: center;
    justify-content: none;
  }
}
</style>
