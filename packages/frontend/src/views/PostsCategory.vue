<template>
  <PostsContainer
    :posts="posts"
    :is-loading="isFetching"
    :has-next-page="hasNextPage"
    @fetch-more="handleNextPage"
  >
    <template #no-content>
      No content found at the moment. <br />
      Please check back later for updates. <br />
      Thank you.
    </template>

    <template #no-more-content>
      Thank you for exploring all available content in this category. <br />
      Please check back later for more updates.
    </template>
  </PostsContainer>
</template>

<script setup lang="ts">
import { onBeforeMount, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '@/api';
import { postTypes } from '@/api/posts';
import PostsContainer from '@/components/PostsContainer/PostsContainer.vue';
import * as consts from '@/const';

const route = useRoute();

const isFetching = ref(false);

const posts = ref<postTypes.Post[]>([]);

const curPage = ref(0);
const hasNextPage = ref(false);

/**
 *
 * @param options
 * @param options.isCombine - if true, posts are concatenated to the existing array
 */
const fetchPosts = async ({ isCombine = false } = {}) => {
  const pageApiRequestsMap = {
    Home: api.posts.getToday,
    All: api.posts.getAll,
    Blowing: api.posts.getBlowing,
    TopThisWeek: api.posts.getTopThisWeek,
    New: api.posts.getRecent,
    Feed: api.posts.getFeed,
  };

  const apiRequestByPageName =
    pageApiRequestsMap[route.name as keyof typeof pageApiRequestsMap];

  if (!apiRequestByPageName) {
    return;
  }

  try {
    isFetching.value = true;

    const data = await apiRequestByPageName({
      limit: consts.POSTS_INITIAL_COUNT,
      offset: curPage.value * consts.POSTS_INITIAL_COUNT,
    });

    hasNextPage.value = data.hasNextPage;

    if (isCombine) {
      posts.value = posts.value.concat(data.posts);
    } else {
      posts.value = data.posts;
    }
  } finally {
    isFetching.value = false;
  }
};

const handleNextPage = () => {
  curPage.value = curPage.value + 1;
  fetchPosts({ isCombine: true });
};

watch(
  () => route.name,
  () => {
    posts.value = [];
    isFetching.value = false;
    curPage.value = 0;
    hasNextPage.value = false;
    fetchPosts();
  },
);

onBeforeMount(() => {
  fetchPosts();
});
</script>
