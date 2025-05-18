<template>
  <div class="search">
    <div class="search__form">
      <SearchForm v-model="filter" />
    </div>

    <PostsContainer
      v-if="isAnyFilterActive"
      :posts="posts"
      :is-loading="isLoading"
      :has-next-page="hasNextPage"
      @fetch-more="handleNextPage"
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

<script lang="ts">
import { defineComponent } from 'vue';
import { api } from '@/api';
import PostsContainer from '@/components/PostsContainer/PostsContainer.vue';
import * as consts from '@/const';
import SearchForm from '@components/SearchForm/SearchForm.vue';

export default defineComponent({
  components: {
    SearchForm,
    PostsContainer,
  },
  data() {
    return {
      isLoading: false,
      posts: [],
      curPage: 0,
      hasNextPage: false,
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
    async fetchPosts({ isCombine = false, filters = this.filter } = {}) {
      try {
        this.isLoading = true;

        const data = await api.posts.search({
          limit: consts.POSTS_INITIAL_COUNT,
          offset: this.curPage * consts.POSTS_INITIAL_COUNT,
          ...filters,
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

<style lang="scss">
@use '@/styles/mixins';

.search {
  &__form {
    @include mixins.widget;

    @include mixins.for-size(phone-only) {
      margin-left: 0;
      border: none;
    }

    margin-bottom: var(--variable-widget-margin);
    margin-left: 10%;
  }
}
</style>
