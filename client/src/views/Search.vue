<template>
  <div class="search">
    <div class="search__form">
      <SearchForm v-model="filter" />
    </div>

    <PostsContainer
      v-if="isAnyFilterActive"
      :posts="posts"
      :is-loading="isLoading"
      :is-no-more-posts="isNoMorePosts"
      @load-more="handleNextPage"
    >
      <template #no-content>
        It looks like we couldn't find any posts that match your filters. <br />
        Please try adjusting your search criteria!
      </template>

      <template #no-more-content>
        Thank you for exploring all available content. <br />
        Please check back later for more updates.
      </template>
    </PostsContainer>
  </div>
</template>

<script>
import api from '@/api';
import PostsContainer from '@/components/PostsContainer/PostsContainer.vue';
import consts from '@/const/const';
import SearchForm from '@components/SearchForm/SearchForm.vue';

export default {
  components: {
    SearchForm,
    PostsContainer,
  },
  data() {
    return {
      isLoading: false,
      posts: [],
      curPage: 0,
      isNoMorePosts: false,
      filter: {
        title: '',
        ratingFrom: null,
        ratingTo: null,
        dateFrom: '',
        dateTo: '',
        tags: [],
      },
    };
  },
  computed: {
    isAnyFilterActive() {
      return Object.keys(this.filter).some((filterKey) => {
        if (filterKey === 'tags') {
          return this.filter.tags.length > 0;
        }

        return Boolean(this.filter[filterKey]);
      });
    },
  },
  watch: {
    filter(newVal) {
      this.fetchPosts({ filters: newVal });
    },
  },
  created() {
    Object.keys(this.$route.query).forEach((filterKey) => {
      if (this.$route.query[filterKey]) {
        this.filter[filterKey] = this.$route.query[filterKey];
      }
    });

    if (this.isAnyFilterActive) {
      this.fetchPosts({ filters: this.filter });
    }
  },
  methods: {
    /**
     *
     * @param {Object} options
     * @param {boolean=} options.isCombine - if true, posts are concatenated to the existing array
     * @param {Object} options.filters - filters to be applied to the request
     */
    async fetchPosts({ isCombine, filters = this.filter } = {}) {
      this.isLoading = true;

      const res = await api.posts.search({
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

      this.isLoading = false;
    },
    handleNextPage() {
      this.curPage = this.curPage + 1;
      this.fetchPosts({ isCombine: true });
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/mixins';

.search {
  &__form {
    @include widget;

    @include for-size(phone-only) {
      margin-left: 0;
      border: none;
    }

    margin-bottom: var(--variable-widget-margin);
    margin-left: 10%;
  }
}
</style>
