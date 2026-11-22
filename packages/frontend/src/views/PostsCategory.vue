<template>
  <PostsContainer
    :posts="posts"
    :is-loading="isFetching"
    :has-next-page="hasNextPage"
    @fetch-more="handleNextPage"
  >
    <template #no-content>
      <EmptyState
        v-if="route.name === 'Feed'"
        title="Your feed is empty"
        line="Posts from the authors and tags you follow show up here. Follow an author on their profile, or a tag on any post."
      >
        <template #actions>
          <BaseButton :to="{ name: 'All' }">Browse all posts</BaseButton>
        </template>
      </EmptyState>

      <EmptyState
        v-else-if="route.name === 'Home'"
        title="Nothing new today yet"
        line="See what people liked most this week, or browse all posts."
      >
        <template #actions>
          <BaseButton :to="{ name: 'TopThisWeek' }">Top this week</BaseButton>
          <BaseButton :to="{ name: 'All' }">All posts</BaseButton>
        </template>
      </EmptyState>

      <EmptyState
        v-else
        :title="categoryEmpty.title"
        :line="categoryEmpty.line"
      />
    </template>

    <template #no-more-content>
      {{ endLine }}
    </template>
  </PostsContainer>
</template>

<script setup lang="ts">
import { computed, onBeforeMount, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '@/api';
import { postTypes } from '@/api/posts';
import EmptyState from '@components/PostsContainer/EmptyState.vue';
import PostsContainer from '@components/PostsContainer/PostsContainer.vue';
import BaseButton from '@common/BaseButton.vue';
import { useLatestRequest } from '@/composables/use-latest-request';
import { useRestorablePosts } from '@/composables/use-restorable-posts';
import * as consts from '@/const';

const route = useRoute();

const posts = ref<postTypes.Post[]>([]);

const categoryEmpty = computed(() => {
  switch (route.name) {
    case 'Trending':
      return {
        title: 'Nothing is trending yet',
        line: 'This list fills as posts collect votes.',
      };
    case 'TopThisWeek':
      return {
        title: 'No posts this week yet',
        line: 'The best rated posts of the last seven days show up here.',
      };
    case 'New':
      return {
        title: 'No posts yet',
        line: 'New posts show up here as they are written.',
      };
    default:
      return {
        title: 'No posts yet',
        line: 'Every post on Smiler shows up here.',
      };
  }
});

const endLine = computed(() =>
  route.name === 'Feed'
    ? "That's every post from the authors and tags you follow."
    : "That's every post in this category.",
);

const { run: fetchLatest, isPending: isFetching } = useLatestRequest();

const curPage = ref(0);
const nextCursor = ref<string | null>(null);
const hasNextPage = ref(false);

const { restore } = useRestorablePosts(posts, {
  curPage,
  nextCursor,
  hasNextPage,
});

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
  Trending: api.posts.getBlowing,
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

  if (isCursorPagedRoute(routeName)) {
    const cursor = isCombine ? nextCursor.value : null;

    const data = await fetchLatest((signal) =>
      cursorPagedRequests[routeName](
        { limit: consts.POSTS_INITIAL_COUNT, ...(cursor && { cursor }) },
        { signal },
      ),
    );

    if (!data) {
      return;
    }

    nextCursor.value = data.nextCursor;
    hasNextPage.value = data.hasNextPage;
    posts.value = isCombine ? posts.value.concat(data.posts) : data.posts;

    return;
  }

  if (isOffsetPagedRoute(routeName)) {
    const data = await fetchLatest((signal) =>
      offsetPagedRequests[routeName](
        {
          limit: consts.POSTS_INITIAL_COUNT,
          offset: curPage.value * consts.POSTS_INITIAL_COUNT,
        },
        { signal },
      ),
    );

    if (!data) {
      return;
    }

    hasNextPage.value = data.hasNextPage;
    posts.value = isCombine ? posts.value.concat(data.posts) : data.posts;
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
    curPage.value = 0;
    nextCursor.value = null;
    hasNextPage.value = false;
    fetchPosts();
  },
);

onBeforeMount(() => {
  if (!restore()) {
    fetchPosts();
  }
});
</script>
