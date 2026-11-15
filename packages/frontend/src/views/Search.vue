<template>
  <div class="search">
    <div class="search__form u-widget">
      <SearchForm :filter="filter" @submit="search" />
    </div>

    <PostsContainer
      v-if="isAnyFilterActive"
      v-model:posts="posts"
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
import {
  isNavigationFailure,
  NavigationFailureType,
  useRoute,
  useRouter,
} from 'vue-router';
import { api } from '@/api';
import { postTypes } from '@/api/posts';
import PostsContainer from '@/components/PostsContainer/PostsContainer.vue';
import { useLatestRequest } from '@/composables/use-latest-request';
import { useRestorablePosts } from '@/composables/use-restorable-posts';
import * as consts from '@/const';
import SearchForm from '@components/SearchForm/SearchForm.vue';
import { isFilterSet } from '@components/SearchForm/is-filter-set';
import { filterFromQuery, filterToQuery } from '@components/SearchForm/query';
import type { SearchFilter } from '@components/SearchForm/types';

const route = useRoute();
const router = useRouter();

const {
  run: fetchLatest,
  cancel: cancelFetch,
  isPending: isLoading,
} = useLatestRequest();

const posts = ref<postTypes.Post[]>([]);

const currentPage = ref(0);
const hasNextPage = ref(false);

const { restore } = useRestorablePosts(posts, { currentPage, hasNextPage });

const filter = ref<SearchFilter>(filterFromQuery(route.query));

/**
 *
 * @param {Object} options
 * @param {boolean=} options.isCombine - if true, posts are concatenated to the existing array
 */
const fetchPosts = async ({ isCombine = false } = {}) => {
  const data = await fetchLatest((signal) =>
    api.posts.search(
      {
        limit: consts.POSTS_INITIAL_COUNT,
        offset: currentPage.value * consts.POSTS_INITIAL_COUNT,
        ...filter.value,
      },
      { signal },
    ),
  );

  if (!data) {
    return;
  }

  hasNextPage.value = data.hasNextPage;

  if (isCombine) {
    posts.value = posts.value.concat(data.posts);
  } else {
    posts.value = data.posts;
  }
};

const handleNextPage = () => {
  currentPage.value = currentPage.value + 1;
  fetchPosts({ isCombine: true });
};

const isAnyFilterActive = computed(() =>
  Object.values(filter.value).some(isFilterSet),
);

const fetchFirstPage = () => {
  currentPage.value = 0;
  fetchPosts();
};

const showSearchFromRoute = () => {
  filter.value = filterFromQuery(route.query);
  // A page of the previous search must not land in a restored list either
  cancelFetch();

  if (isAnyFilterActive.value && !restore()) {
    fetchFirstPage();
  }
};

const search = async (newFilter: SearchFilter) => {
  const failure = await router.push({ query: filterToQuery(newFilter) });

  // The same search again: there is no new address to follow, but a fresh
  // first page is what Submit is expected to bring
  if (
    isNavigationFailure(failure, NavigationFailureType.duplicated) &&
    isAnyFilterActive.value
  ) {
    fetchFirstPage();
  }
};

watch(
  () => route.query,
  () => {
    // It also fires as the page is left for another
    if (route.name === 'Search') {
      showSearchFromRoute();
    }
  },
);

onBeforeMount(() => {
  if (isAnyFilterActive.value && !restore()) {
    fetchFirstPage();
  }
});
</script>

<style>
.search {
  &__form {
    margin-bottom: var(--variable-widget-margin);
  }
}
</style>
