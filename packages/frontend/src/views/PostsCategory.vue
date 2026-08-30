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
const nextCursor = ref<string | null>(null);
const hasNextPage = ref(false);

/** Sorted by the date of creation, so they page by cursor: an offset would
 * repeat posts that new ones had pushed down between two pages. */
const cursorPagedRequests = {
  New: api.posts.getRecent,
  Feed: api.posts.getFeed,
};

/** Sorted by rating, which changes as votes land, so a cursor over it would be
 * no more stable than an offset. */
const offsetPagedRequests = {
  Home: api.posts.getToday,
  All: api.posts.getAll,
  Blowing: api.posts.getBlowing,
  TopThisWeek: api.posts.getTopThisWeek,
};

type CursorPagedRoute = keyof typeof cursorPagedRequests;
type OffsetPagedRoute = keyof typeof offsetPagedRequests;

const isCursorPagedRoute = (name: string): name is CursorPagedRoute =>
  name in cursorPagedRequests;

const isOffsetPagedRoute = (name: string): name is OffsetPagedRoute =>
  name in offsetPagedRequests;

/**
 *
 * @param options
 * @param options.isCombine - if true, posts are concatenated to the existing array
 */
const fetchPosts = async ({ isCombine = false } = {}) => {
  const routeName = String(route.name ?? '');

  try {
    isFetching.value = true;

    if (isCursorPagedRoute(routeName)) {
      const cursor = isCombine ? nextCursor.value : null;

      const data = await cursorPagedRequests[routeName]({
        limit: consts.POSTS_INITIAL_COUNT,
        ...(cursor && { cursor }),
      });

      nextCursor.value = data.nextCursor;
      hasNextPage.value = data.hasNextPage;
      posts.value = isCombine ? posts.value.concat(data.posts) : data.posts;

      return;
    }

    if (isOffsetPagedRoute(routeName)) {
      const data = await offsetPagedRequests[routeName]({
        limit: consts.POSTS_INITIAL_COUNT,
        offset: curPage.value * consts.POSTS_INITIAL_COUNT,
      });

      hasNextPage.value = data.hasNextPage;
      posts.value = isCombine ? posts.value.concat(data.posts) : data.posts;
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
    nextCursor.value = null;
    hasNextPage.value = false;
    fetchPosts();
  },
);

onBeforeMount(() => {
  fetchPosts();
});
</script>
