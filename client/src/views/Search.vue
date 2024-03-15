<template>
  <div>
    <div class="search-form">
      <SearchForm v-model="filter" />
    </div>
    <PostsContainer
      v-if="isAnyFilterActive"
      :search-filter="filter"
    />
  </div>
</template>

<script>
import SearchForm from '@/components/SearchForm/SearchForm.vue';
import PostsContainer from '@/views/PostsContainer.vue';

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
@import '@/styles/colors';
@import '@/styles/mixins';
@import '@/styles/variables';

.search-form {
  @include widget;

  margin-left: 10%;

  @include for-size(phone-only) {
    margin-left: 0;
    border: none;
  }

  margin-bottom: $widget-margin;
}
</style>
