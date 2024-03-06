<template>
  <div>
    <div class="search-form">
      <SearchForm
        v-model="filter"
      />
    </div>
    <PostsContainer
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
