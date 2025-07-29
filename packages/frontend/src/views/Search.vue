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

<script setup lang="ts">
import { computed, onBeforeMount, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '@/api';
import { postTypes } from '@/api/posts';
import PostsContainer from '@/components/PostsContainer/PostsContainer.vue';
import * as consts from '@/const';
import SearchForm from '@components/SearchForm/SearchForm.vue';
import type { SearchFilter } from '@components/SearchForm/types';

const route = useRoute();

const isLoading = ref(false);

const posts = ref<postTypes.Post[]>([]);

const currentPage = ref(0);
const hasNextPage = ref(false);

const filter = ref<SearchFilter>({
  title: '',
  ratingFrom: null,
  ratingTo: null,
  dateFrom: '',
  dateTo: '',
  tags: [],
});

/**
 *
 * @param {Object} options
 * @param {boolean=} options.isCombine - if true, posts are concatenated to the existing array
 * @param {Object} options.filters - filters to be applied to the request
 */
const fetchPosts = async ({
  isCombine = false,
  filters = filter.value,
}: { isCombine?: boolean; filters?: SearchFilter } = {}) => {
  try {
    isLoading.value = true;

    const data = await api.posts.search({
      limit: consts.POSTS_INITIAL_COUNT,
      offset: currentPage.value * consts.POSTS_INITIAL_COUNT,
      ...filters,
    });

    hasNextPage.value = data.hasNextPage;

    if (isCombine) {
      posts.value = posts.value.concat(data.posts);
    } else {
      posts.value = data.posts;
    }
  } finally {
    isLoading.value = false;
  }
};

const handleNextPage = () => {
  currentPage.value = currentPage.value + 1;
  fetchPosts({ isCombine: true });
};

watch(filter, (newVal) => {
  const isAnyFilterActive = Object.keys(newVal).some((filterKey) => {
    if (filterKey === 'tags') {
      return newVal.tags.length > 0;
    }

    return Boolean(newVal[filterKey as keyof SearchFilter]);
  });

  if (isAnyFilterActive) {
    fetchPosts({ filters: newVal });
  }
});

const isAnyFilterActive = computed(() => {
  return Object.keys(filter.value).some((filterKey) => {
    if (filterKey === 'tags') {
      return filter.value.tags.length > 0;
    }

    return Boolean(filter.value[filterKey as keyof SearchFilter]);
  });
});

onBeforeMount(() => {
  Object.keys(route.query).forEach((filterKey) => {
    if (route.query[filterKey]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (filter.value[filterKey as keyof SearchFilter] as any) =
        route.query[filterKey];
    }
  });

  if (isAnyFilterActive.value) {
    fetchPosts({ filters: filter.value });
  }
});
</script>

<style lang="scss">
@use '@/styles/mixins';

.search {
  &__form {
    @include mixins.widget;

    margin-bottom: var(--variable-widget-margin);
    margin-left: 10%;

    @include mixins.for-size(phone-only) {
      margin-left: 0;
      border: none;
    }
  }
}
</style>
