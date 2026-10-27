<template>
  <div>
    <!-- TODO: Skeleton? -->
    <UserProfile v-if="user" :user="user" />

    <PostsContainer
      v-model:posts="posts"
      :is-loading="isLoading"
      :has-next-page="hasNextPage"
      @fetch-more="handleNextPage"
    >
      <template #no-content>
        This author has not posted anything yet.
      </template>

      <template #no-more-content>
        You've read all the posts this author had posted!
      </template>
    </PostsContainer>
  </div>
</template>

<script setup lang="ts">
import { onBeforeMount, ref } from 'vue';
import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';
import { api } from '@/api';
import { postTypes } from '@/api/posts';
import { userTypes } from '@/api/users';
import PostsContainer from '@/components/PostsContainer/PostsContainer.vue';
import { useRestorablePosts } from '@/composables/use-restorable-posts';
import * as consts from '@/const';
import UserProfile from '@components/User/UserProfile.vue';

const route = useRoute();
const router = useRouter();

const posts = ref<postTypes.Post[]>([]);

const user = ref<userTypes.GetUserProfileResponse | null>(null);

const isLoading = ref(false);

const nextCursor = ref<string | null>(null);
const hasNextPage = ref(false);

const { restore } = useRestorablePosts(posts, {
  user,
  nextCursor,
  hasNextPage,
});

const handleFetchUser = async (login: string) => {
  try {
    const fetchedUser = await api.users.getUserProfile(login);

    user.value = fetchedUser;
  } catch {
    router.push({
      name: 'NotFound',
    });
  }
};

/**
 *
 * @param options
 * @param isCombine - if true, posts are concatenated to the existing array
 */
const handleFetchPosts = async ({ isCombine = false } = {}) => {
  try {
    isLoading.value = true;

    const cursor = isCombine ? nextCursor.value : null;

    const data = await api.posts.getPostsByAuthor({
      author: user.value?.login || (route.params.login as string),
      limit: consts.POSTS_INITIAL_COUNT,
      ...(cursor && { cursor }),
    });

    nextCursor.value = data.nextCursor;
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
  handleFetchPosts({ isCombine: true });
};

const handleFetchAll = async (login: string) => {
  await handleFetchUser(login);
  await handleFetchPosts();
};

// `route` still holds the old login here: the update has not happened yet
onBeforeRouteUpdate((to, from) => {
  if (to.params.login !== from.params.login) {
    handleFetchAll(to.params.login as string);
  }
});

onBeforeMount(() => {
  const login = route.params.login as string;

  if (restore()) {
    // The profile keeps its own copy of a follow, so the saved one may be behind
    void handleFetchUser(login);
  } else {
    handleFetchAll(login);
  }
});
</script>
