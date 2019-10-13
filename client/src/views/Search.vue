<template>
<div>
  <div class="search-form">
    <search-form
      v-model="filter"
    />
  </div>
  <posts-container
    :search-filter="filter"
  />
</div>
</template>

<script>
import searchForm from '@/components/SearchForm/SearchForm.vue';
import postsContainer from '@/views/PostsContainer.vue';

export default {
  components: {
    searchForm,
    postsContainer,
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
  created() {
    Object.keys(this.filter).forEach((el) => {
      if (this.$route.query[el]) {
        this.filter[el] = this.$route.query[el];
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
