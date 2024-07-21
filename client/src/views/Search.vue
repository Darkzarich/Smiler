<template>
  <div class="search">
    <div class="search__form">
      <SearchForm v-model="filter" />
    </div>

    <PostsContainer v-if="isAnyFilterActive" :search-filters="filter" />
  </div>
</template>

<script>
import PostsContainer from '@/views/PostsContainer.vue';
import SearchForm from '@components/SearchForm/SearchForm.vue';

export default {
  components: {
    SearchForm,
    PostsContainer,
  },
  data() {
    return {
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
  created() {
    Object.keys(this.$route.query).forEach((filterKey) => {
      if (this.$route.query[filterKey]) {
        this.filter[filterKey] = this.$route.query[filterKey];
      }
    });
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
